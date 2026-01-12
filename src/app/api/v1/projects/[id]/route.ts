import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorType,
  handleApiError,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { updateProjectSchema } from '@/lib/validations/project'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET /api/v1/projects/:id
 * Get a single project
 */
export const GET = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: { id: string } }
  ) => {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: params.id,
          organizationId: context.organizationId,
        },
        include: {
          client: true,
          commissionPlans: {
            select: { id: true, name: true, isActive: true },
          },
          _count: {
            select: { salesTransactions: true, commissionPlans: true },
          },
        },
      })

      if (!project) {
        return createErrorResponse(ApiErrorType.NOT_FOUND, 'Project not found')
      }

      return createSuccessResponse(project)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'projects:read' }
)

/**
 * PUT /api/v1/projects/:id
 * Update a project
 */
export const PUT = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: { id: string } }
  ) => {
    try {
      const body = await request.json()
      const validatedData = updateProjectSchema.parse(body)

      // Verify exists and belongs to organization
      const existing = await prisma.project.findFirst({
        where: { id: params.id, organizationId: context.organizationId },
      })

      if (!existing) {
        return createErrorResponse(ApiErrorType.NOT_FOUND, 'Project not found')
      }

      // Verify client belongs to organization if provided
      if (validatedData.clientId) {
        const client = await prisma.client.findFirst({
          where: {
            id: validatedData.clientId,
            organizationId: context.organizationId,
          },
        })
        if (!client) throw new Error('Client not found')
      }

      const updated = await prisma.project.update({
        where: { id: params.id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.clientId && { clientId: validatedData.clientId }),
          ...(validatedData.startDate !== undefined && {
            startDate: validatedData.startDate
              ? new Date(validatedData.startDate as string)
              : null,
          }),
          ...(validatedData.endDate !== undefined && {
            endDate: validatedData.endDate
              ? new Date(validatedData.endDate as string)
              : null,
          }),
          ...(validatedData.status && { status: validatedData.status }),
        },
        include: { client: true },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_updated',
        entityType: 'project',
        entityId: params.id,
        description: `Project updated via API: ${updated.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(updated, 'Project updated successfully')
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'projects:write' }
)

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
export const DELETE = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: { id: string } }
  ) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: params.id, organizationId: context.organizationId },
        include: {
          _count: {
            select: { salesTransactions: true, commissionPlans: true },
          },
        },
      })

      if (!project) {
        return createErrorResponse(ApiErrorType.NOT_FOUND, 'Project not found')
      }

      // Check if has dependencies
      if (
        project._count.salesTransactions > 0 ||
        project._count.commissionPlans > 0
      ) {
        return createErrorResponse(
          ApiErrorType.BAD_REQUEST,
          'Cannot delete project with associated sales transactions or commission plans'
        )
      }

      await prisma.project.delete({
        where: { id: params.id },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_deleted',
        entityType: 'project',
        entityId: params.id,
        description: `Project deleted via API: ${project.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        { message: 'Project deleted successfully' },
        'Project deleted successfully'
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'projects:write' }
)
