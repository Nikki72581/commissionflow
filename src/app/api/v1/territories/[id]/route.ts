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

const updateTerritorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
})

/**
 * GET /api/v1/territories/:id
 * Get a single territory
 */
export const GET = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const territory = await prisma.territory.findFirst({
        where: {
          id: id,
          organizationId: context.organizationId,
        },
        include: {
          _count: {
            select: {
              clients: true,
              commissionRules: true,
            },
          },
        },
      })

      if (!territory) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Territory not found'
        )
      }

      return createSuccessResponse(territory)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'territories:read' }
)

/**
 * PUT /api/v1/territories/:id
 * Update a territory
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
      const validatedData = updateTerritorySchema.parse(body)

      // Verify exists and belongs to organization
      const existing = await prisma.territory.findFirst({
        where: { id: id, organizationId: context.organizationId },
      })

      if (!existing) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Territory not found'
        )
      }

      const updated = await prisma.territory.update({
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
        description: `Territory updated via API: ${updated.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(updated, 'Territory updated successfully')
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'territories:write' }
)

/**
 * DELETE /api/v1/territories/:id
 * Delete a territory
 */
export const DELETE = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const territory = await prisma.territory.findFirst({
        where: { id: id, organizationId: context.organizationId },
        include: {
          _count: {
            select: {
              clients: true,
              commissionRules: true,
            },
          },
        },
      })

      if (!territory) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Territory not found'
        )
      }

      // Check if has dependencies
      if (
        territory._count.clients > 0 ||
        territory._count.commissionRules > 0
      ) {
        return createErrorResponse(
          ApiErrorType.BAD_REQUEST,
          'Cannot delete territory with associated clients or commission rules'
        )
      }

      await prisma.territory.delete({
        where: { id: id },
      })

      // Audit log
      await createAuditLog({
        action: 'settings_updated',
        entityType: 'settings',
        entityId: id,
        description: `Territory deleted via API: ${territory.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        { message: 'Territory deleted successfully' },
        'Territory deleted successfully'
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'territories:write' }
)
