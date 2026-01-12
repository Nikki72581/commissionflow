import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorType,
  handleApiError,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { updateClientSchema } from '@/lib/validations/client'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET /api/v1/clients/:id
 * Get a single client
 */
export const GET = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const client = await prisma.client.findFirst({
        where: {
          id: id,
          organizationId: context.organizationId,
        },
        include: {
          territory: true,
          projects: {
            select: { id: true, name: true, status: true },
          },
          _count: {
            select: { projects: true, salesTransactions: true },
          },
        },
      })

      if (!client) {
        return createErrorResponse(ApiErrorType.NOT_FOUND, 'Client not found')
      }

      return createSuccessResponse(client)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'clients:read' }
)

/**
 * PUT /api/v1/clients/:id
 * Update a client
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
      const validatedData = updateClientSchema.parse(body)

      // Verify exists and belongs to organization
      const existing = await prisma.client.findFirst({
        where: { id: id, organizationId: context.organizationId },
      })

      if (!existing) {
        return createErrorResponse(ApiErrorType.NOT_FOUND, 'Client not found')
      }

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

      const updated = await prisma.client.update({
        where: { id: id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.email !== undefined && {
            email: validatedData.email || null,
          }),
          ...(validatedData.phone !== undefined && {
            phone: validatedData.phone,
          }),
          ...(validatedData.address !== undefined && {
            address: validatedData.address,
          }),
          ...(validatedData.notes !== undefined && {
            notes: validatedData.notes,
          }),
          ...(validatedData.tier && { tier: validatedData.tier }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.clientId !== undefined && {
            clientId: validatedData.clientId,
          }),
          ...(validatedData.territoryId !== undefined && {
            territoryId: validatedData.territoryId,
          }),
        },
        include: { territory: true },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_updated',
        entityType: 'client',
        entityId: id,
        description: `Client updated via API: ${updated.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(updated, 'Client updated successfully')
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'clients:write' }
)

/**
 * DELETE /api/v1/clients/:id
 * Delete a client
 */
export const DELETE = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const client = await prisma.client.findFirst({
        where: { id: id, organizationId: context.organizationId },
        include: {
          _count: {
            select: { projects: true, salesTransactions: true },
          },
        },
      })

      if (!client) {
        return createErrorResponse(ApiErrorType.NOT_FOUND, 'Client not found')
      }

      // Check if has dependencies
      if (client._count.projects > 0 || client._count.salesTransactions > 0) {
        return createErrorResponse(
          ApiErrorType.BAD_REQUEST,
          'Cannot delete client with associated projects or sales transactions'
        )
      }

      await prisma.client.delete({
        where: { id: id },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_deleted',
        entityType: 'client',
        entityId: id,
        description: `Client deleted via API: ${client.name}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        { message: 'Client deleted successfully' },
        'Client deleted successfully'
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'clients:write' }
)
