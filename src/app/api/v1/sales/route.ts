import { NextRequest } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { createSuccessResponse, handleApiError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { createSalesTransactionSchema } from '@/lib/validations/sales-transaction'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET /api/v1/sales
 * List sales transactions
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const { searchParams } = request.nextUrl
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const skip = (page - 1) * limit

      const [transactions, total] = await Promise.all([
        prisma.salesTransaction.findMany({
          where: { organizationId: context.organizationId },
          include: {
            project: {
              include: { client: true },
            },
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
            commissionCalculations: {
              select: { id: true, amount: true, status: true },
            },
          },
          orderBy: { transactionDate: 'desc' },
          take: limit,
          skip,
        }),
        prisma.salesTransaction.count({
          where: { organizationId: context.organizationId },
        }),
      ])

      return createSuccessResponse({
        transactions,
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
  { requiredScope: 'sales:read' }
)

/**
 * POST /api/v1/sales
 * Create a new sales transaction
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const body = await request.json()

      // Validate input
      const validatedData = createSalesTransactionSchema.parse(body)

      // Get organization settings
      const organization = await prisma.organization.findUnique({
        where: { id: context.organizationId },
        select: { requireProjects: true },
      })

      if (organization?.requireProjects && !validatedData.projectId) {
        throw new Error('Project is required for sales transactions')
      }

      // Verify related entities belong to organization
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

      const user = await prisma.user.findFirst({
        where: { id: validatedData.userId, organizationId: context.organizationId },
      })
      if (!user) throw new Error('Salesperson not found')

      // Create transaction
      const transaction = await prisma.salesTransaction.create({
        data: {
          amount: validatedData.amount,
          transactionDate: new Date(validatedData.transactionDate),
          transactionType: validatedData.transactionType || 'SALE',
          projectId: validatedData.projectId,
          clientId: validatedData.clientId,
          userId: validatedData.userId,
          productCategoryId: validatedData.productCategoryId,
          invoiceNumber: validatedData.invoiceNumber,
          description: validatedData.description,
          organizationId: context.organizationId,
          sourceType: 'INTEGRATION',
          externalSystem: 'API',
        },
        include: {
          project: { include: { client: true } },
          client: true,
          user: true,
        },
      })

      // Audit log
      await createAuditLog({
        action: 'sale_created',
        entityType: 'sale',
        entityId: transaction.id,
        description: `Sale created via API: $${transaction.amount}`,
        metadata: { source: 'api', apiKeyId: context.apiKeyId },
        organizationId: context.organizationId,
      })

      return createSuccessResponse(
        transaction,
        'Sale created successfully',
        201
      )
    } catch (error) {
      return handleApiError(error)
    }
  },
  { requiredScope: 'sales:write' }
)
