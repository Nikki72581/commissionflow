import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorType,
  handleApiError,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'

const updateProductCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
})

/**
 * GET /api/v1/product-categories/:id
 * Get a single product category
 */
export const GET = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const category = await prisma.productCategory.findFirst({
        where: {
          id: id,
          organizationId: context.organizationId,
        },
        include: {
          _count: {
            select: {
              salesTransactions: true,
              commissionRules: true,
            },
          },
        },
      })

      if (!category) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Product category not found'
        )
      }

      return createSuccessResponse(category)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'categories:read' }
)

/**
 * PUT /api/v1/product-categories/:id
 * Update a product category
 */
export const PUT = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const body = await request.json()
      const validatedData = updateProductCategorySchema.parse(body)

      // Verify exists and belongs to organization
      const existing = await prisma.productCategory.findFirst({
        where: { id: id, organizationId: context.organizationId },
      })

      if (!existing) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Product category not found'
        )
      }

      const updated = await prisma.productCategory.update({
        where: { id: id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
        },
      })

      // Audit log
      await createAuditLog({
        action: 'settings_updated',
        entityType: 'settings',
        entityId: id,
        description: `Product category updated via API: ${updated.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        updated,
        'Product category updated successfully'
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'categories:write' }
)

/**
 * DELETE /api/v1/product-categories/:id
 * Delete a product category
 */
export const DELETE = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const category = await prisma.productCategory.findFirst({
        where: { id: id, organizationId: context.organizationId },
        include: {
          _count: {
            select: {
              salesTransactions: true,
              commissionRules: true,
            },
          },
        },
      })

      if (!category) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Product category not found'
        )
      }

      // Check if has dependencies
      if (
        category._count.salesTransactions > 0 ||
        category._count.commissionRules > 0
      ) {
        return createErrorResponse(
          ApiErrorType.BAD_REQUEST,
          'Cannot delete product category with associated sales transactions or commission rules'
        )
      }

      await prisma.productCategory.delete({
        where: { id: id },
      })

      // Audit log
      await createAuditLog({
        action: 'settings_updated',
        entityType: 'settings',
        entityId: id,
        description: `Product category deleted via API: ${category.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        { message: 'Product category deleted successfully' },
        'Product category deleted successfully'
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'categories:write' }
)
