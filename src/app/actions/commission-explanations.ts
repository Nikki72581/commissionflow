'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type {
  CommissionCalculationTrace,
  CommissionExplanation,
  CommissionAdjustmentTrace,
  ExplanationOptions,
} from '@/types/commission-trace'

/**
 * Get current user with organization and role info
 */
async function getCurrentUserWithRole(): Promise<{
  userId: string
  organizationId: string
  role: 'ADMIN' | 'SALESPERSON'
  dbUserId: string
}> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      organizationId: true,
      role: true,
    },
  })

  if (!user?.organizationId) {
    throw new Error('User not associated with an organization')
  }

  return {
    userId: clerkId,
    organizationId: user.organizationId,
    role: user.role,
    dbUserId: user.id,
  }
}

/**
 * Format adjustments from database for trace display
 */
function formatAdjustmentsForTrace(
  adjustments: Array<{
    id: string
    type: string
    amount: number
    reason: string | null
    appliedAt: Date
    appliedBy: {
      firstName: string | null
      lastName: string | null
    }
    relatedTransaction: {
      id: string
    } | null
  }>,
): CommissionAdjustmentTrace[] {
  return adjustments.map((adj) => ({
    id: adj.id,
    type: adj.type as CommissionAdjustmentTrace['type'],
    amount: adj.amount,
    reason: adj.reason ?? undefined,
    relatedTransactionId: adj.relatedTransaction?.id,
    appliedAt: adj.appliedAt,
    appliedBy: `${adj.appliedBy.firstName || ''} ${adj.appliedBy.lastName || ''}`.trim() || undefined,
  }))
}

/**
 * Get full commission explanation for admins.
 * Returns all trace data including internal details.
 */
export async function getCommissionExplanation(calculationId: string): Promise<{
  success: boolean
  data?: CommissionExplanation
  error?: string
}> {
  try {
    const { organizationId, role, dbUserId } = await getCurrentUserWithRole()

    // Fetch the commission calculation with all related data
    const calculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId,
      },
      include: {
        salesTransaction: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
            client: true,
            productCategory: true,
          },
        },
        commissionPlan: {
          include: {
            rules: true,
          },
        },
        user: true,
        adjustments: {
          include: {
            appliedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            relatedTransaction: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            appliedAt: 'desc',
          },
        },
      },
    })

    if (!calculation) {
      throw new Error('Commission calculation not found')
    }

    // For salespeople, verify they can only see their own commissions
    if (role === 'SALESPERSON' && calculation.userId !== dbUserId) {
      throw new Error('You can only view your own commissions')
    }

    // Try to get the trace from metadata
    const trace = calculation.metadata as CommissionCalculationTrace | null

    // Build the explanation
    const transaction = calculation.salesTransaction
    const client = transaction.project?.client || transaction.client

    const explanation: CommissionExplanation = {
      summary: {
        commissionAmount: calculation.amount,
        effectiveRate:
          transaction.amount > 0
            ? (calculation.amount / transaction.amount) * 100
            : 0,
        saleAmount: transaction.amount,
        planName: calculation.commissionPlan.name,
        calculatedAt: calculation.calculatedAt,
        status: calculation.status,
      },
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        date: transaction.transactionDate,
        invoiceNumber: transaction.invoiceNumber ?? undefined,
        description: transaction.description ?? undefined,
        clientName: client?.name,
        projectName: transaction.project?.name,
      },
      adjustments: formatAdjustmentsForTrace(calculation.adjustments),
    }

    // Add applied rule info if available from trace
    if (trace?.ruleTrace) {
      const selectedRule = trace.ruleTrace.find((r) => r.selected)
      if (selectedRule) {
        explanation.appliedRule = {
          description: selectedRule.description ?? selectedRule.ruleName ?? 'Commission rule',
          ruleType: selectedRule.ruleType,
          rate: selectedRule.calculation?.rate,
          flatAmount: selectedRule.calculation?.flatAmount,
          calculation: {
            basisType:
              selectedRule.calculation?.basis === 'NET_SALES'
                ? 'Net Sales'
                : 'Gross Revenue',
            basisAmount: selectedRule.calculation?.basisAmount ?? transaction.amount,
            rawAmount: selectedRule.calculation?.rawAmount ?? calculation.amount,
            finalAmount: selectedRule.calculation?.finalAmount ?? calculation.amount,
          },
        }
      }
    } else {
      // Fallback: Build basic applied rule info from calculation metadata if no trace
      const legacyMetadata = calculation.metadata as any
      if (legacyMetadata?.selectedRule || legacyMetadata?.appliedRules?.length > 0) {
        const appliedRule = legacyMetadata.appliedRules?.[0]
        explanation.appliedRule = {
          description: legacyMetadata.selectedRule?.description ?? appliedRule?.description ?? 'Commission rule',
          ruleType: appliedRule?.ruleType ?? 'PERCENTAGE',
          calculation: {
            basisType:
              legacyMetadata.basis === 'NET_SALES' ? 'Net Sales' : 'Gross Revenue',
            basisAmount: legacyMetadata.basisAmount ?? transaction.amount,
            rawAmount: appliedRule?.calculatedAmount ?? calculation.amount,
            finalAmount: calculation.amount,
          },
        }
      }
    }

    // Add admin-only details if user is admin
    if (role === 'ADMIN') {
      if (trace) {
        explanation.adminDetails = {
          engineVersion: trace.engineVersion,
          planVersion: trace.planVersion,
          fullRuleTrace: trace.ruleTrace,
          inputSnapshot: trace.inputSnapshot,
        }
      } else {
        // Provide minimal admin details from legacy metadata
        const legacyMetadata = calculation.metadata as any
        explanation.adminDetails = {
          engineVersion: 'legacy',
          planVersion: {
            id: calculation.commissionPlan.id,
            name: calculation.commissionPlan.name,
            commissionBasis: calculation.commissionPlan.commissionBasis,
            updatedAt: calculation.commissionPlan.updatedAt,
          },
          fullRuleTrace: [],
          inputSnapshot: {
            transactionId: transaction.id,
            grossAmount: transaction.amount,
            netAmount: legacyMetadata?.netAmount ?? transaction.amount,
            transactionDate: transaction.transactionDate,
            transactionType: transaction.transactionType,
            invoiceNumber: transaction.invoiceNumber ?? undefined,
            salesperson: {
              id: calculation.user.id,
              name: `${calculation.user.firstName || ''} ${calculation.user.lastName || ''}`.trim(),
              email: calculation.user.email,
            },
          },
        }
      }
    }

    return {
      success: true,
      data: explanation,
    }
  } catch (error) {
    console.error('Error getting commission explanation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get explanation',
    }
  }
}

/**
 * Get commission explanation for the current salesperson.
 * Returns limited view appropriate for non-admin users.
 */
export async function getMyCommissionExplanation(calculationId: string): Promise<{
  success: boolean
  data?: CommissionExplanation
  error?: string
}> {
  try {
    const { organizationId, dbUserId } = await getCurrentUserWithRole()

    // Fetch the commission calculation - only if it belongs to the current user
    const calculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId,
        userId: dbUserId, // Only their own commissions
      },
      include: {
        salesTransaction: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
            client: true,
          },
        },
        commissionPlan: true,
        adjustments: {
          include: {
            appliedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            relatedTransaction: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            appliedAt: 'desc',
          },
        },
      },
    })

    if (!calculation) {
      throw new Error('Commission not found or you do not have access to it')
    }

    const trace = calculation.metadata as CommissionCalculationTrace | null
    const transaction = calculation.salesTransaction
    const client = transaction.project?.client || transaction.client

    // Build explanation without admin details
    const explanation: CommissionExplanation = {
      summary: {
        commissionAmount: calculation.amount,
        effectiveRate:
          transaction.amount > 0
            ? (calculation.amount / transaction.amount) * 100
            : 0,
        saleAmount: transaction.amount,
        planName: calculation.commissionPlan.name,
        calculatedAt: calculation.calculatedAt,
        status: calculation.status,
      },
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        date: transaction.transactionDate,
        invoiceNumber: transaction.invoiceNumber ?? undefined,
        description: transaction.description ?? undefined,
        clientName: client?.name,
        projectName: transaction.project?.name,
      },
      adjustments: formatAdjustmentsForTrace(calculation.adjustments),
    }

    // Add simplified applied rule info
    if (trace?.ruleTrace) {
      const selectedRule = trace.ruleTrace.find((r) => r.selected)
      if (selectedRule) {
        explanation.appliedRule = {
          description: selectedRule.description ?? 'Commission rule applied',
          ruleType: selectedRule.ruleType,
          rate: selectedRule.calculation?.rate,
          flatAmount: selectedRule.calculation?.flatAmount,
          calculation: {
            basisType:
              selectedRule.calculation?.basis === 'NET_SALES'
                ? 'Net Sales'
                : 'Gross Revenue',
            basisAmount: selectedRule.calculation?.basisAmount ?? transaction.amount,
            rawAmount: selectedRule.calculation?.rawAmount ?? calculation.amount,
            finalAmount: selectedRule.calculation?.finalAmount ?? calculation.amount,
          },
        }
      }
    }

    // No adminDetails for salespeople
    return {
      success: true,
      data: explanation,
    }
  } catch (error) {
    console.error('Error getting my commission explanation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get explanation',
    }
  }
}

/**
 * Get net commission amount after all adjustments
 */
export async function getNetCommissionAmount(calculationId: string): Promise<{
  success: boolean
  data?: {
    originalAmount: number
    totalAdjustments: number
    netAmount: number
    adjustmentCount: number
  }
  error?: string
}> {
  try {
    const { organizationId } = await getCurrentUserWithRole()

    const calculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId,
      },
      select: {
        amount: true,
      },
    })

    if (!calculation) {
      throw new Error('Commission calculation not found')
    }

    const adjustmentsResult = await prisma.commissionAdjustment.aggregate({
      where: {
        commissionCalculationId: calculationId,
        organizationId,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const totalAdjustments = adjustmentsResult._sum.amount || 0
    const netAmount = calculation.amount + totalAdjustments

    return {
      success: true,
      data: {
        originalAmount: calculation.amount,
        totalAdjustments,
        netAmount,
        adjustmentCount: adjustmentsResult._count,
      },
    }
  } catch (error) {
    console.error('Error calculating net commission amount:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate net amount',
    }
  }
}
