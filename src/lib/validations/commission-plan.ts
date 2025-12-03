import { z } from 'zod'

/**
 * Schema for creating a commission plan
 */
export const createCommissionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  isActive: z.boolean().default(true),
})

/**
 * Schema for updating a commission plan
 */
export const updateCommissionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Schema for creating a commission rule
 */
export const createCommissionRuleSchema = z
  .object({
    commissionPlanId: z.string().min(1, 'Plan ID is required'),
    ruleType: z.enum(['PERCENTAGE', 'FLAT_AMOUNT', 'TIERED'] as const, {
      message: 'Rule type is required',
    }),
    // For PERCENTAGE type
    percentage: z.number().min(0).max(100).optional(),
    // For FLAT_AMOUNT type
    flatAmount: z.number().min(0).optional(),
    // For TIERED type
    tierThreshold: z.number().min(0).optional(),
    tierPercentage: z.number().min(0).max(100).optional(),
    // Optional caps
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate based on rule type
      if (data.ruleType === 'PERCENTAGE') {
        return data.percentage !== undefined && data.percentage > 0
      }
      if (data.ruleType === 'FLAT_AMOUNT') {
        return data.flatAmount !== undefined && data.flatAmount > 0
      }
      if (data.ruleType === 'TIERED') {
        return (
          data.tierThreshold !== undefined &&
          data.tierPercentage !== undefined &&
          data.tierPercentage > 0
        )
      }
      return true
    },
    {
      message: 'Invalid rule configuration for the selected type',
    }
  )
  .refine(
    (data) => {
      // Validate that maxAmount is greater than minAmount if both are set
      if (data.minAmount !== undefined && data.maxAmount !== undefined) {
        return data.maxAmount > data.minAmount
      }
      return true
    },
    {
      message: 'Maximum amount must be greater than minimum amount',
    }
  )

/**
 * Schema for updating a commission rule
 */
export const updateCommissionRuleSchema = z
  .object({
    ruleType: z.enum(['PERCENTAGE', 'FLAT_AMOUNT', 'TIERED'] as const).optional(),
    percentage: z.number().min(0).max(100).optional(),
    flatAmount: z.number().min(0).optional(),
    tierThreshold: z.number().min(0).optional(),
    tierPercentage: z.number().min(0).max(100).optional(),
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate that maxAmount is greater than minAmount if both are set
      if (data.minAmount !== undefined && data.maxAmount !== undefined) {
        return data.maxAmount > data.minAmount
      }
      return true
    },
    {
      message: 'Maximum amount must be greater than minimum amount',
    }
  )

/**
 * Types inferred from schemas
 */
export type CreateCommissionPlanInput = z.infer<typeof createCommissionPlanSchema>
export type UpdateCommissionPlanInput = z.infer<typeof updateCommissionPlanSchema>
export type CreateCommissionRuleInput = z.infer<typeof createCommissionRuleSchema>
export type UpdateCommissionRuleInput = z.infer<typeof updateCommissionRuleSchema>
