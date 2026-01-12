import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { createSuccessResponse, handleApiError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { createClientSchema } from '@/lib/validations/client'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET /api/v1/clients
 * List clients
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const { searchParams } = request.nextUrl
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const skip = (page - 1) * limit

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where: { organizationId: context.organizationId },
          include: {
            territory: true,
            _count: {
              select: { projects: true, salesTransactions: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.client.count({
          where: { organizationId: context.organizationId },
        }),
      ])

      return createSuccessResponse({
        clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'clients:read' }
)

/**
 * POST /api/v1/clients
 * Create a new client
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const body = await request.json()
      const validatedData = createClientSchema.parse(body)

      // Verify territory belongs to organization if provided
      if (validatedData.territoryId) {
        const territory = await prisma.territory.findFirst({
          where: {
            id: validatedData.territoryId,
            organizationId: context.organizationId,
          },
        })
        if (!territory) throw new Error('Territory not found')
      }

      const client = await prisma.client.create({
        data: {
          name: validatedData.name,
          email: validatedData.email || null,
          phone: validatedData.phone,
          address: validatedData.address,
          notes: validatedData.notes,
          tier: validatedData.tier || 'STANDARD',
          status: validatedData.status || 'ACTIVE',
          clientId: validatedData.clientId,
          territoryId: validatedData.territoryId,
          organizationId: context.organizationId,
          sourceType: 'INTEGRATION',
          externalSystem: 'API',
        },
        include: { territory: true },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_created',
        entityType: 'client',
        entityId: client.id,
        description: `Client created via API: ${client.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(client, 'Client created successfully', 201)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'clients:write' }
)
