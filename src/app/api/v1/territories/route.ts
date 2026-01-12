import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { createSuccessResponse, handleApiError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'

const createTerritorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
})

/**
 * GET /api/v1/territories
 * List all territories
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const territories = await prisma.territory.findMany({
        where: { organizationId: context.organizationId },
        include: {
          _count: {
            select: { clients: true, commissionRules: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      return createSuccessResponse({ territories })
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'territories:read' }
)

/**
 * POST /api/v1/territories
 * Create a new territory
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const body = await request.json()
      const validatedData = createTerritorySchema.parse(body)

      const territory = await prisma.territory.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          organizationId: context.organizationId,
        },
      })

      // Audit log
      await createAuditLog({
        action: 'settings_updated',
        entityType: 'settings',
        entityId: territory.id,
        description: `Territory created via API: ${territory.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        territory,
        'Territory created successfully',
        201
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'territories:write' }
)
