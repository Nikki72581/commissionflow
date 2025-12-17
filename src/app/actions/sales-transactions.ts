'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import {
  calculateCommission,
  calculateCommissionWithPrecedence,
  type CalculationContext,
  type ScopedCommissionRule,
} from '@/lib/commission-calculator'
import { calculateNetSalesAmount } from '@/lib/net-sales-calculator'
import {
  createSalesTransactionSchema,
  updateSalesTransactionSchema,
} from '@/lib/validations/sales-transaction'
import type {
  CreateSalesTransactionInput,
  UpdateSalesTransactionInput,
} from '@/lib/validations/sales-transaction'

/**
 * Get organization ID for current user
 */
async function getOrganizationId(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    throw new Error('User not associated with an organization')
  }

  return user.organizationId
}

// ============================================
// SALES TRANSACTION ACTIONS
// ============================================

/**
 * Create a new sales transaction and calculate commission
 */
export async function createSalesTransaction(data: CreateSalesTransactionInput) {
  try {
    const organizationId = await getOrganizationId()
    
    // Validate input
    const validatedData = createSalesTransactionSchema.parse(data)

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        organizationId,
      },
      include: {
        client: {
          include: {
            territory: true,
          },
        },
        commissionPlans: {
          where: { isActive: true },
          include: { rules: true },
        },
      },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Verify user belongs to organization
    const user = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        organizationId,
      },
    })

    if (!user) {
      throw new Error('Salesperson not found')
    }

    // Determine which commission plan to use
    let commissionPlanId = validatedData.commissionPlanId
    
    if (!commissionPlanId) {
      // Use project's first active plan if no specific plan provided
      if (project.commissionPlans.length > 0) {
        commissionPlanId = project.commissionPlans[0].id
      }
    }

    // Verify commission plan if provided
    let commissionPlan = null
    if (commissionPlanId) {
      commissionPlan = await prisma.commissionPlan.findFirst({
        where: {
          id: commissionPlanId,
          organizationId,
          isActive: true,
        },
        include: { rules: true },
      })

      if (!commissionPlan) {
        throw new Error('Commission plan not found or inactive')
      }
    }

    // Convert date string to Date object
    const transactionDate = new Date(validatedData.transactionDate)

    // Create transaction
    const transaction = await prisma.salesTransaction.create({
      data: {
        amount: validatedData.amount,
        transactionDate,
        transactionType: validatedData.transactionType || 'SALE',
        parentTransactionId: validatedData.parentTransactionId,
        productCategoryId: validatedData.productCategoryId,
        description: validatedData.description,
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        organizationId,
      },
      include: {
        project: {
          include: {
            client: {
              include: { territory: true }
            }
          },
        },
        user: true,
        productCategory: true,
      },
    })

    // Calculate commission if plan exists
    let calculation = null
    if (commissionPlan && commissionPlan.rules.length > 0) {
      // Calculate net sales amount
      const netAmount = await calculateNetSalesAmount(transaction.id)

      // Build calculation context
      const context: CalculationContext = {
        grossAmount: validatedData.amount,
        netAmount,
        transactionDate,
        customerId: project.client.id,
        customerTier: project.client.tier,
        projectId: validatedData.projectId,
        productCategoryId: validatedData.productCategoryId,
        territoryId: project.client.territoryId || undefined,
        commissionBasis: commissionPlan.commissionBasis,
      }

      // Use precedence-aware calculator
      const result = calculateCommissionWithPrecedence(
        context,
        commissionPlan.rules as ScopedCommissionRule[]
      )

      // Build metadata for audit trail
      const metadata = {
        basis: result.basis,
        basisAmount: result.basisAmount,
        grossAmount: validatedData.amount,
        netAmount,
        context: {
          customerTier: project.client.tier,
          customerId: project.client.id,
          customerName: project.client.name,
          productCategoryId: validatedData.productCategoryId,
          territoryId: project.client.territoryId,
          territoryName: project.client.territory?.name,
        },
        selectedRule: result.selectedRule,
        matchedRules: result.matchedRules,
        appliedRules: result.appliedRules,
        calculatedAt: new Date().toISOString(),
      }

      calculation = await prisma.commissionCalculation.create({
        data: {
          salesTransactionId: transaction.id,
          userId: validatedData.userId,
          commissionPlanId: commissionPlan.id,
          amount: result.finalAmount,
          metadata,
          calculatedAt: new Date(),
          status: 'PENDING',
          organizationId,
        },
      })
    }

    revalidatePath('/dashboard/sales')
    revalidatePath('/dashboard/commissions')
    revalidatePath(`/dashboard/projects/${validatedData.projectId}`)
    
    return {
      success: true,
      data: {
        transaction,
        calculation,
      },
    }
  } catch (error) {
    console.error('Error creating sales transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sales transaction',
    }
  }
}

/**
 * Get all sales transactions for the organization
 */
export async function getSalesTransactions() {
  try {
    const organizationId = await getOrganizationId()

    const transactions = await prisma.salesTransaction.findMany({
      where: {
        organizationId,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        user: true,
        commissionCalculations: {
          include: {
            commissionPlan: true,
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    })

    return {
      success: true,
      data: transactions,
    }
  } catch (error) {
    console.error('Error fetching sales transactions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales transactions',
    }
  }
}

/**
 * Get a single sales transaction by ID
 */
export async function getSalesTransaction(transactionId: string) {
  try {
    const organizationId = await getOrganizationId()

    const transaction = await prisma.salesTransaction.findFirst({
      where: {
        id: transactionId,
        organizationId,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        user: true,
        commissionCalculations: {
          include: {
            commissionPlan: {
              include: {
                rules: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      throw new Error('Sales transaction not found')
    }

    return {
      success: true,
      data: transaction,
    }
  } catch (error) {
    console.error('Error fetching sales transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales transaction',
    }
  }
}

/**
 * Update a sales transaction
 */
export async function updateSalesTransaction(
  transactionId: string,
  data: UpdateSalesTransactionInput
) {
  try {
    const organizationId = await getOrganizationId()
    
    // Validate input
    const validatedData = updateSalesTransactionSchema.parse(data)

    // Verify transaction belongs to organization
    const existingTransaction = await prisma.salesTransaction.findFirst({
      where: {
        id: transactionId,
        organizationId,
      },
    })

    if (!existingTransaction) {
      throw new Error('Sales transaction not found')
    }

    // If updating project, verify it belongs to organization
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          organizationId,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }
    }

    // If updating user, verify they belong to organization
    if (validatedData.userId) {
      const user = await prisma.user.findFirst({
        where: {
          id: validatedData.userId,
          organizationId,
        },
      })

      if (!user) {
        throw new Error('Salesperson not found')
      }
    }

    // Convert date string if provided
    const updateData: any = { ...validatedData }
    if (validatedData.transactionDate) {
      updateData.transactionDate = new Date(validatedData.transactionDate)
    }

    // Update transaction
    const transaction = await prisma.salesTransaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        project: {
          include: { client: true },
        },
        user: true,
      },
    })

    revalidatePath('/dashboard/sales')
    revalidatePath(`/dashboard/sales/${transactionId}`)
    
    return {
      success: true,
      data: transaction,
    }
  } catch (error) {
    console.error('Error updating sales transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sales transaction',
    }
  }
}

/**
 * Delete a sales transaction
 */
export async function deleteSalesTransaction(transactionId: string) {
  try {
    const organizationId = await getOrganizationId()

    // Verify transaction belongs to organization
    const existingTransaction = await prisma.salesTransaction.findFirst({
      where: {
        id: transactionId,
        organizationId,
      },
      include: {
        commissionCalculations: true,
      },
    })

    if (!existingTransaction) {
      throw new Error('Sales transaction not found')
    }

    // Check if any calculations are already paid
    const hasPaidCalculations = existingTransaction.commissionCalculations.some(
      (calc) => calc.status === 'PAID'
    )

    if (hasPaidCalculations) {
      throw new Error('Cannot delete transaction with paid commissions')
    }

    // Delete transaction (will cascade delete calculations)
    await prisma.salesTransaction.delete({
      where: { id: transactionId },
    })

    revalidatePath('/dashboard/sales')
    revalidatePath('/dashboard/commissions')
    
    return {
      success: true,
      message: 'Sales transaction deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting sales transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sales transaction',
    }
  }
}

/**
 * Recalculate commission for a transaction
 */
export async function recalculateCommission(transactionId: string, planId: string) {
  try {
    const organizationId = await getOrganizationId()

    // Get transaction with full context
    const transaction = await prisma.salesTransaction.findFirst({
      where: {
        id: transactionId,
        organizationId,
      },
      include: {
        project: {
          include: {
            client: {
              include: {
                territory: true,
              },
            },
          },
        },
        productCategory: true,
      },
    })

    if (!transaction) {
      throw new Error('Sales transaction not found')
    }

    // Get commission plan with rules
    const plan = await prisma.commissionPlan.findFirst({
      where: {
        id: planId,
        organizationId,
      },
      include: {
        rules: true,
      },
    })

    if (!plan) {
      throw new Error('Commission plan not found')
    }

    // Calculate net sales amount
    const netAmount = await calculateNetSalesAmount(transaction.id)

    // Build calculation context
    const context: CalculationContext = {
      grossAmount: transaction.amount,
      netAmount,
      transactionDate: transaction.transactionDate,
      customerId: transaction.project.client.id,
      customerTier: transaction.project.client.tier,
      projectId: transaction.projectId,
      productCategoryId: transaction.productCategoryId || undefined,
      territoryId: transaction.project.client.territoryId || undefined,
      commissionBasis: plan.commissionBasis,
    }

    // Use precedence-aware calculator
    const result = calculateCommissionWithPrecedence(
      context,
      plan.rules as ScopedCommissionRule[]
    )

    // Build metadata
    const metadata = {
      basis: result.basis,
      basisAmount: result.basisAmount,
      grossAmount: transaction.amount,
      netAmount,
      context: {
        customerTier: transaction.project.client.tier,
        customerId: transaction.project.client.id,
        customerName: transaction.project.client.name,
        productCategoryId: transaction.productCategoryId,
        territoryId: transaction.project.client.territoryId,
        territoryName: transaction.project.client.territory?.name,
      },
      selectedRule: result.selectedRule,
      matchedRules: result.matchedRules,
      appliedRules: result.appliedRules,
      calculatedAt: new Date().toISOString(),
      recalculated: true,
    }

    // Delete existing calculations for this transaction that aren't paid
    await prisma.commissionCalculation.deleteMany({
      where: {
        salesTransactionId: transactionId,
        status: { not: 'PAID' },
      },
    })

    // Create new calculation
    const calculation = await prisma.commissionCalculation.create({
      data: {
        salesTransactionId: transaction.id,
        userId: transaction.userId,
        commissionPlanId: plan.id,
        amount: result.finalAmount,
        metadata,
        calculatedAt: new Date(),
        status: 'PENDING',
        organizationId,
      },
      include: {
        commissionPlan: true,
      },
    })

    revalidatePath('/dashboard/sales')
    revalidatePath('/dashboard/commissions')
    revalidatePath(`/dashboard/sales/${transactionId}`)

    return {
      success: true,
      data: calculation,
    }
  } catch (error) {
    console.error('Error recalculating commission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recalculate commission',
    }
  }
}

/**
 * Get sales statistics
 */
export async function getSalesStats() {
  try {
    const organizationId = await getOrganizationId()

    const [totalSales, totalAmount, thisMonthSales, thisMonthAmount] = await Promise.all([
      // Total sales count
      prisma.salesTransaction.count({
        where: { organizationId },
      }),
      // Total sales amount
      prisma.salesTransaction.aggregate({
        where: { organizationId },
        _sum: { amount: true },
      }),
      // This month sales count
      prisma.salesTransaction.count({
        where: {
          organizationId,
          transactionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // This month sales amount
      prisma.salesTransaction.aggregate({
        where: {
          organizationId,
          transactionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalSales,
        totalAmount: totalAmount._sum.amount || 0,
        thisMonthSales,
        thisMonthAmount: thisMonthAmount._sum.amount || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching sales stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    }
  }
}
