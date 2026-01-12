import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { createSuccessResponse, handleApiError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { createProjectSchema } from '@/lib/validations/project'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET /api/v1/projects
 * List projects
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const { searchParams } = request.nextUrl
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const skip = (page - 1) * limit

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where: { organizationId: context.organizationId },
          include: {
            client: {
              select: { id: true, name: true, tier: true, status: true },
            },
            _count: {
              select: { salesTransactions: true, commissionPlans: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.project.count({
          where: { organizationId: context.organizationId },
        }),
      ])

      return createSuccessResponse({
        projects,
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
  { requiredScope: 'projects:read' }
)

/**
 * POST /api/v1/projects
 * Create a new project
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const body = await request.json()
      const validatedData = createProjectSchema.parse(body)

      // Verify client belongs to organization
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          organizationId: context.organizationId,
        },
      })
      if (!client) throw new Error('Client not found')

      const project = await prisma.project.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          clientId: validatedData.clientId,
          startDate: validatedData.startDate
            ? new Date(validatedData.startDate as string)
            : null,
          endDate: validatedData.endDate
            ? new Date(validatedData.endDate as string)
            : null,
          status: validatedData.status || 'active',
          organizationId: context.organizationId,
          sourceType: 'INTEGRATION',
          externalSystem: 'API',
        },
        include: { client: true },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_created',
        entityType: 'project',
        entityId: project.id,
        description: `Project created via API: ${project.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(project, 'Project created successfully', 201)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'projects:write' }
)
