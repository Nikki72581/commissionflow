import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { createSuccessResponse, handleApiError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'

const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
})

/**
 * GET /api/v1/product-categories
 * List all product categories
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const categories = await prisma.productCategory.findMany({
        where: { organizationId: context.organizationId },
        include: {
          _count: {
            select: { salesTransactions: true, commissionRules: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      return createSuccessResponse({ categories })
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'categories:read' }
)

/**
 * POST /api/v1/product-categories
 * Create a new product category
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const body = await request.json()
      const validatedData = createProductCategorySchema.parse(body)

      const category = await prisma.productCategory.create({
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
        entityId: category.id,
        description: `Product category created via API: ${category.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        category,
        'Product category created successfully',
        201
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'categories:write' }
)
