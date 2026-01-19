'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'
import type { AdjustmentType } from '@prisma/client'

/**
 * Get organization ID and user info for current user
 */
async function getCurrentUserContext(): Promise<{
  organizationId: string
  userId: string
  userName: string
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
      firstName: true,
      lastName: true,
    },
  })

  if (!user?.organizationId) {
    throw new Error('User not associated with an organization')
  }

  return {
    organizationId: user.organizationId,
    userId: user.id,
    userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
  }
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createAdjustmentSchema = z.object({
  commissionCalculationId: z.string().min(1, 'Commission calculation ID is required'),
  type: z.enum(['RETURN', 'CLAWBACK', 'OVERRIDE', 'SPLIT_CREDIT']),
  amount: z.number(), // Can be negative (deductions) or positive (additions)
  reason: z.string().optional(),
  notes: z.string().optional(), // Admin-only notes
  relatedTransactionId: z.string().optional(),
})

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>

// ============================================
// ADJUSTMENT ACTIONS
// ============================================

/**
 * Create a new adjustment for a commission calculation
 */
export async function createAdjustment(data: CreateAdjustmentInput) {
  try {
    const { organizationId, userId, userName } = await getCurrentUserContext()

    // Validate input
    const validatedData = createAdjustmentSchema.parse(data)

    // Verify the commission calculation exists and belongs to the organization
    const calculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: validatedData.commissionCalculationId,
        organizationId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        salesTransaction: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    })

    if (!calculation) {
      throw new Error('Commission calculation not found')
    }

    // If there's a related transaction, verify it exists and belongs to the org
    if (validatedData.relatedTransactionId) {
      const relatedTransaction = await prisma.salesTransaction.findFirst({
        where: {
          id: validatedData.relatedTransactionId,
          organizationId,
        },
      })

      if (!relatedTransaction) {
        throw new Error('Related transaction not found')
      }
    }

    // Create the adjustment
    const adjustment = await prisma.commissionAdjustment.create({
      data: {
        commissionCalculationId: validatedData.commissionCalculationId,
        organizationId,
        type: validatedData.type,
        amount: validatedData.amount,
        reason: validatedData.reason,
        notes: validatedData.notes,
        relatedTransactionId: validatedData.relatedTransactionId,
        appliedById: userId,
      },
      include: {
        appliedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        relatedTransaction: {
          select: {
            invoiceNumber: true,
            amount: true,
          },
        },
      },
    })

    // Create audit log
    const salespersonName = `${calculation.user.firstName || ''} ${calculation.user.lastName || ''}`.trim()
    await createAuditLog({
      userId,
      userName,
      action: 'adjustment_created',
      entityType: 'commission_adjustment',
      entityId: adjustment.id,
      description: `Created ${validatedData.type} adjustment of $${Math.abs(validatedData.amount).toFixed(2)} for ${salespersonName}'s commission on invoice ${calculation.salesTransaction.invoiceNumber || 'N/A'}`,
      metadata: {
        adjustmentType: validatedData.type,
        amount: validatedData.amount,
        reason: validatedData.reason,
        commissionCalculationId: validatedData.commissionCalculationId,
      },
      organizationId,
    })

    revalidatePath('/dashboard/commissions')
    revalidatePath(`/dashboard/commissions/${validatedData.commissionCalculationId}`)

    return {
      success: true,
      data: adjustment,
    }
  } catch (error) {
    console.error('Error creating adjustment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create adjustment',
    }
  }
}

/**
 * Get all adjustments for a specific commission calculation
 */
export async function getAdjustmentsForCalculation(commissionCalculationId: string) {
  try {
    const { organizationId } = await getCurrentUserContext()

    // Verify the commission calculation exists and belongs to the organization
    const calculation = await prisma.commissionCalculation.findFirst({
      where: {
        id: commissionCalculationId,
        organizationId,
      },
    })

    if (!calculation) {
      throw new Error('Commission calculation not found')
    }

    const adjustments = await prisma.commissionAdjustment.findMany({
      where: {
        commissionCalculationId,
        organizationId,
      },
      include: {
        appliedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        relatedTransaction: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            transactionType: true,
            transactionDate: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    })

    return {
      success: true,
      data: adjustments,
    }
  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch adjustments',
    }
  }
}

/**
 * Delete an adjustment (admin only)
 */
export async function deleteAdjustment(adjustmentId: string) {
  try {
    const { organizationId, userId, userName } = await getCurrentUserContext()

    // Verify the adjustment exists and belongs to the organization
    const adjustment = await prisma.commissionAdjustment.findFirst({
      where: {
        id: adjustmentId,
        organizationId,
      },
      include: {
        commissionCalculation: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            salesTransaction: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        },
      },
    })

    if (!adjustment) {
      throw new Error('Adjustment not found')
    }

    // Delete the adjustment
    await prisma.commissionAdjustment.delete({
      where: { id: adjustmentId },
    })

    // Create audit log
    const salespersonName = `${adjustment.commissionCalculation.user.firstName || ''} ${adjustment.commissionCalculation.user.lastName || ''}`.trim()
    await createAuditLog({
      userId,
      userName,
      action: 'adjustment_deleted',
      entityType: 'commission_adjustment',
      entityId: adjustmentId,
      description: `Deleted ${adjustment.type} adjustment of $${Math.abs(adjustment.amount).toFixed(2)} for ${salespersonName}'s commission on invoice ${adjustment.commissionCalculation.salesTransaction.invoiceNumber || 'N/A'}`,
      metadata: {
        adjustmentType: adjustment.type,
        amount: adjustment.amount,
        reason: adjustment.reason,
        commissionCalculationId: adjustment.commissionCalculationId,
      },
      organizationId,
    })

    revalidatePath('/dashboard/commissions')
    revalidatePath(`/dashboard/commissions/${adjustment.commissionCalculationId}`)

    return {
      success: true,
      message: 'Adjustment deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting adjustment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete adjustment',
    }
  }
}

/**
 * Automatically create a RETURN adjustment when a return transaction is linked
 * to a parent sale that has a commission calculation.
 * This is called from the sales transaction creation flow.
 */
export async function linkReturnToCommission(
  returnTransactionId: string,
  parentTransactionId: string,
  returnAmount: number,
) {
  try {
    const { organizationId, userId, userName } = await getCurrentUserContext()

    // Find the commission calculation for the parent transaction
    const parentCalculation = await prisma.commissionCalculation.findFirst({
      where: {
        salesTransactionId: parentTransactionId,
        organizationId,
      },
      include: {
        commissionPlan: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        salesTransaction: {
          select: {
            invoiceNumber: true,
            amount: true,
          },
        },
      },
    })

    // If no commission calculation exists for the parent, nothing to adjust
    if (!parentCalculation) {
      return {
        success: true,
        data: null,
        message: 'No commission calculation found for parent transaction',
      }
    }

    // Calculate the commission impact of the return
    // Use the same rate as the original commission
    const originalRate = parentCalculation.salesTransaction.amount > 0
      ? parentCalculation.amount / parentCalculation.salesTransaction.amount
      : 0

    // The adjustment amount is negative (reducing the commission)
    const adjustmentAmount = -(Math.abs(returnAmount) * originalRate)

    // Create the RETURN adjustment
    const adjustment = await prisma.commissionAdjustment.create({
      data: {
        commissionCalculationId: parentCalculation.id,
        organizationId,
        type: 'RETURN',
        amount: adjustmentAmount,
        reason: `Return transaction linked to original sale`,
        relatedTransactionId: returnTransactionId,
        appliedById: userId,
      },
    })

    // Create audit log
    const salespersonName = `${parentCalculation.user.firstName || ''} ${parentCalculation.user.lastName || ''}`.trim()
    await createAuditLog({
      userId,
      userName,
      action: 'adjustment_created',
      entityType: 'commission_adjustment',
      entityId: adjustment.id,
      description: `Auto-created RETURN adjustment of $${Math.abs(adjustmentAmount).toFixed(2)} for ${salespersonName}'s commission due to return on invoice ${parentCalculation.salesTransaction.invoiceNumber || 'N/A'}`,
      metadata: {
        adjustmentType: 'RETURN',
        amount: adjustmentAmount,
        returnAmount,
        originalCommission: parentCalculation.amount,
        commissionCalculationId: parentCalculation.id,
        returnTransactionId,
      },
      organizationId,
    })

    revalidatePath('/dashboard/commissions')

    return {
      success: true,
      data: adjustment,
    }
  } catch (error) {
    console.error('Error linking return to commission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to link return to commission',
    }
  }
}

/**
 * Get total adjustments sum for a commission calculation
 */
export async function getAdjustmentsTotal(commissionCalculationId: string) {
  try {
    const { organizationId } = await getCurrentUserContext()

    const result = await prisma.commissionAdjustment.aggregate({
      where: {
        commissionCalculationId,
        organizationId,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    return {
      success: true,
      data: {
        total: result._sum.amount || 0,
        count: result._count,
      },
    }
  } catch (error) {
    console.error('Error calculating adjustments total:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate adjustments total',
    }
  }
}
