'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { bulkApproveSchema } from '@/lib/validations/sales-transaction'
import type { BulkApproveInput } from '@/lib/validations/sales-transaction'
import { sendCommissionApprovedNotification } from '@/app/actions/email-notifications'

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
// COMMISSION CALCULATION ACTIONS
// ============================================

/**
 * Get all commission calculations
 */
export async function getCommissionCalculations() {
  try {
    const organizationId = await getOrganizationId()

    const calculations = await prisma.commissionCalculation.findMany({
      where: {
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
          },
        },
        user: true,
        commissionPlan: true,
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    })

    return {
      success: true,
      data: calculations,
    }
  } catch (error) {
    console.error('Error fetching commission calculations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch calculations',
    }
  }
}

/**
 * Get a single commission calculation by ID
 */
export async function getCommissionCalculation(calculationId: string) {
  try {
    const organizationId = await getOrganizationId()

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
          },
        },
        user: true,
        commissionPlan: {
          include: {
            rules: true,
          },
        },
      },
    })

    if (!calculation) {
      throw new Error('Commission calculation not found')
    }

    return {
      success: true,
      data: calculation,
    }
  } catch (error) {
    console.error('Error fetching commission calculation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch calculation',
    }
  }
}

/**
 * Approve a single commission calculation
 */
export async function approveCalculation(calculationId: string) {
  try {
    const organizationId = await getOrganizationId()

    // Verify calculation belongs to organization
    const existingCalculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId,
      },
    })

    if (!existingCalculation) {
      throw new Error('Commission calculation not found')
    }

    if (existingCalculation.status === 'PAID') {
      throw new Error('Cannot approve a commission that has already been paid')
    }

    // Update status to APPROVED
    const calculation = await prisma.commissionCalculation.update({
      where: { id: calculationId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      include: {
        salesTransaction: true,
        user: true,
        commissionPlan: true,
      },

    })

    // Send notification (async, non-blocking)
    sendCommissionApprovedNotification(calculationId).catch((error) => {
      console.error('Failed to send approval notification:', error)
    })

    revalidatePath('/dashboard/commissions')
    revalidatePath(`/dashboard/commissions/${calculationId}`)
    
    return {
      success: true,
      data: calculation,
    }
  } catch (error) {
    console.error('Error approving calculation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve calculation',
    }
  }
}

/**
 * Bulk approve multiple commission calculations
 */
export async function bulkApproveCalculations(data: BulkApproveInput) {
  try {
    const organizationId = await getOrganizationId()
    
    // Validate input
    const validatedData = bulkApproveSchema.parse(data)

    // Verify all calculations belong to organization and aren't paid
    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        id: { in: validatedData.calculationIds },
        organizationId,
      },
    })

    if (calculations.length !== validatedData.calculationIds.length) {
      throw new Error('Some calculations were not found')
    }

    const hasPaidCalculations = calculations.some((calc) => calc.status === 'PAID')
    if (hasPaidCalculations) {
      throw new Error('Cannot approve calculations that have already been paid')
    }

    // Update all to APPROVED
    await prisma.commissionCalculation.updateMany({
      where: {
        id: { in: validatedData.calculationIds },
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    })

    revalidatePath('/dashboard/commissions')
    
    return {
      success: true,
      message: `${validatedData.calculationIds.length} calculation(s) approved successfully`,
    }
  } catch (error) {
    console.error('Error bulk approving calculations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk approve calculations',
    }
  }
}

/**
 * Mark a calculation as paid
 */
export async function markCalculationPaid(calculationId: string) {
  try {
    const organizationId = await getOrganizationId()

    // Verify calculation belongs to organization
    const existingCalculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId,
      },
    })

    if (!existingCalculation) {
      throw new Error('Commission calculation not found')
    }

    if (existingCalculation.status === 'PENDING') {
      throw new Error('Cannot mark pending calculation as paid. Approve it first.')
    }

    if (existingCalculation.status === 'PAID') {
      throw new Error('This commission has already been marked as paid')
    }

    // Update status to PAID
    const calculation = await prisma.commissionCalculation.update({
      where: { id: calculationId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        salesTransaction: true,
        user: true,
        commissionPlan: true,
      },
    })

    revalidatePath('/dashboard/commissions')
    revalidatePath(`/dashboard/commissions/${calculationId}`)
    
    return {
      success: true,
      data: calculation,
    }
  } catch (error) {
    console.error('Error marking calculation as paid:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as paid',
    }
  }
}

/**
 * Reject a commission calculation
 */
export async function rejectCalculation(calculationId: string, reason?: string) {
  try {
    const organizationId = await getOrganizationId()

    // Verify calculation belongs to organization
    const existingCalculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: calculationId,
        organizationId,
      },
    })

    if (!existingCalculation) {
      throw new Error('Commission calculation not found')
    }

    if (existingCalculation.status === 'PAID') {
      throw new Error('Cannot reject a commission that has already been paid')
    }

    // Delete the calculation (rejection)
    await prisma.commissionCalculation.delete({
      where: { id: calculationId },
    })

    revalidatePath('/dashboard/commissions')
    
    return {
      success: true,
      message: 'Commission calculation rejected successfully',
    }
  } catch (error) {
    console.error('Error rejecting calculation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject calculation',
    }
  }
}

/**
 * Get commission statistics
 */
export async function getCommissionStats() {
  try {
    const organizationId = await getOrganizationId()

    const [totalCalculations, totalAmount, pendingAmount, approvedAmount, paidAmount] =
      await Promise.all([
        // Total calculations count
        prisma.commissionCalculation.count({
          where: { organizationId },
        }),
        // Total amount
        prisma.commissionCalculation.aggregate({
          where: { organizationId },
          _sum: { amount: true },
        }),
        // Pending amount
        prisma.commissionCalculation.aggregate({
          where: {
            organizationId,
            status: 'PENDING',
          },
          _sum: { amount: true },
        }),
        // Approved amount
        prisma.commissionCalculation.aggregate({
          where: {
            organizationId,
            status: 'APPROVED',
          },
          _sum: { amount: true },
        }),
        // Paid amount
        prisma.commissionCalculation.aggregate({
          where: {
            organizationId,
            status: 'PAID',
          },
          _sum: { amount: true },
        }),
      ])

    return {
      success: true,
      data: {
        totalCalculations,
        totalAmount: totalAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        approvedAmount: approvedAmount._sum.amount || 0,
        paidAmount: paidAmount._sum.amount || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching commission stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    }
  }
}

/**
 * Get calculations for a specific user (salesperson)
 */
export async function getUserCalculations(userId: string) {
  try {
    const organizationId = await getOrganizationId()

    // Verify user belongs to organization
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        userId,
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
          },
        },
        commissionPlan: true,
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    })

    return {
      success: true,
      data: calculations,
    }
  } catch (error) {
    console.error('Error fetching user calculations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user calculations',
    }
  }
}

/**
 * Recalculate commissions for unapproved/unpaid status
 * This is useful when commission rules change or transaction amounts are corrected
 */
export async function recalculateCommissions(calculationIds: string[]) {
  try {
    const organizationId = await getOrganizationId()

    if (calculationIds.length === 0) {
      throw new Error('No calculations selected for recalculation')
    }

    // Fetch calculations with all necessary data for recalculation
    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        id: { in: calculationIds },
        organizationId,
        status: { in: ['PENDING', 'CALCULATED'] }, // Only recalculate non-approved, non-paid
      },
      include: {
        salesTransaction: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        commissionPlan: {
          include: {
            rules: true,
          },
        },
        user: true,
      },
    })

    if (calculations.length === 0) {
      throw new Error('No eligible calculations found for recalculation (only PENDING or CALCULATED status can be recalculated)')
    }

    // Import calculator
    const { calculateCommissionWithPrecedence } = await import('@/lib/commission-calculator')

    let recalculatedCount = 0
    let unchangedCount = 0
    const errors: string[] = []

    // Recalculate each commission
    for (const calc of calculations) {
      try {
        const { salesTransaction, commissionPlan } = calc

        // Build calculation context from transaction
        const context = {
          grossAmount: salesTransaction.grossAmount,
          netAmount: salesTransaction.netAmount,
          transactionDate: salesTransaction.transactionDate,
          customerId: salesTransaction.project?.clientId,
          customerTier: salesTransaction.project?.client?.tier,
          projectId: salesTransaction.projectId,
          territoryId: salesTransaction.project?.client?.territoryId,
          commissionBasis: commissionPlan.commissionBasis,
        }

        // Recalculate with current rules
        const result = calculateCommissionWithPrecedence(
          context,
          commissionPlan.rules as any
        )

        // Update if amount changed
        if (result.finalAmount !== calc.amount) {
          await prisma.commissionCalculation.update({
            where: { id: calc.id },
            data: {
              amount: result.finalAmount,
              calculatedAt: new Date(),
              calculationDetails: result as any,
            },
          })
          recalculatedCount++
        } else {
          unchangedCount++
        }
      } catch (error) {
        console.error(`Error recalculating commission ${calc.id}:`, error)
        errors.push(`Failed to recalculate commission for ${calc.user.firstName} ${calc.user.lastName}`)
      }
    }

    revalidatePath('/dashboard/commissions')

    return {
      success: true,
      message: `Recalculated ${recalculatedCount} commission(s). ${unchangedCount} unchanged.`,
      data: {
        recalculatedCount,
        unchangedCount,
        errors,
      },
    }
  } catch (error) {
    console.error('Error recalculating commissions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recalculate commissions',
    }
  }
}
