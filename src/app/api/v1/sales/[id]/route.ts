import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorType,
  handleApiError,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { updateSalesTransactionSchema } from '@/lib/validations/sales-transaction'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET /api/v1/sales/:id
 * Get a single sales transaction
 */
export const GET = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const transaction = await prisma.salesTransaction.findFirst({
        where: {
          id: id,
          organizationId: context.organizationId,
        },
        include: {
          project: { include: { client: true } },
          client: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          productCategory: true,
          commissionCalculations: true,
        },
      })

      if (!transaction) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Sales transaction not found'
        )
      }

      return createSuccessResponse(transaction)
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'sales:read' }
)

/**
 * PUT /api/v1/sales/:id
 * Update a sales transaction
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
      const validatedData = updateSalesTransactionSchema.parse(body)

      // Verify exists and belongs to organization
      const existing = await prisma.salesTransaction.findFirst({
        where: { id: id, organizationId: context.organizationId },
      })

      if (!existing) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Sales transaction not found'
        )
      }

      // Verify related entities belong to organization if provided
      if (validatedData.projectId) {
        const project = await prisma.project.findFirst({
          where: {
            id: validatedData.projectId,
            organizationId: context.organizationId,
          },
        })
        if (!project) throw new Error('Project not found')
      }

      if (validatedData.clientId) {
        const client = await prisma.client.findFirst({
          where: {
            id: validatedData.clientId,
            organizationId: context.organizationId,
          },
        })
        if (!client) throw new Error('Client not found')
      }

      if (validatedData.userId) {
        const user = await prisma.user.findFirst({
          where: {
            id: validatedData.userId,
            organizationId: context.organizationId,
          },
        })
        if (!user) throw new Error('Salesperson not found')
      }

      const updated = await prisma.salesTransaction.update({
        where: { id: id },
        data: {
          ...(validatedData.amount !== undefined && {
            amount: validatedData.amount,
          }),
          ...(validatedData.transactionDate && {
            transactionDate: new Date(validatedData.transactionDate),
          }),
          ...(validatedData.transactionType && {
            transactionType: validatedData.transactionType,
          }),
          ...(validatedData.projectId !== undefined && {
            projectId: validatedData.projectId,
          }),
          ...(validatedData.clientId !== undefined && {
            clientId: validatedData.clientId,
          }),
          ...(validatedData.userId !== undefined && {
            userId: validatedData.userId,
          }),
          ...(validatedData.productCategoryId !== undefined && {
            productCategoryId: validatedData.productCategoryId,
          }),
          ...(validatedData.invoiceNumber !== undefined && {
            invoiceNumber: validatedData.invoiceNumber,
          }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
        },
        include: {
          project: { include: { client: true } },
          client: true,
          user: true,
        },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_updated',
        entityType: 'sale',
        entityId: id,
        description: `Sale updated via API`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(updated, 'Sale updated successfully')
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'sales:write' }
)

/**
 * DELETE /api/v1/sales/:id
 * Delete a sales transaction
 */
export const DELETE = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params
      const transaction = await prisma.salesTransaction.findFirst({
        where: { id: id, organizationId: context.organizationId },
        include: { commissionCalculations: true },
      })

      if (!transaction) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          'Sales transaction not found'
        )
      }

      // Check if has paid commissions
      const hasPaid = transaction.commissionCalculations.some(
        (c) => c.status === 'PAID'
      )
      if (hasPaid) {
        return createErrorResponse(
          ApiErrorType.BAD_REQUEST,
          'Cannot delete transaction with paid commissions'
        )
      }

      await prisma.salesTransaction.delete({
        where: { id: id },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_deleted',
        entityType: 'sale',
        entityId: id,
        description: `Sale deleted via API: $${transaction.amount}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        { message: 'Sales transaction deleted successfully' },
        'Sales transaction deleted successfully'
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'sales:write' }
)
