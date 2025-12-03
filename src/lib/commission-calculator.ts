import type { CommissionRule } from '@prisma/client'

export interface CalculationResult {
  baseAmount: number
  cappedAmount: number
  appliedRules: {
    ruleId: string
    ruleType: string
    calculatedAmount: number
    description: string
  }[]
  finalAmount: number
}

/**
 * Calculate commission based on a set of rules
 */
export function calculateCommission(
  saleAmount: number,
  rules: CommissionRule[]
): CalculationResult {
  if (rules.length === 0) {
    return {
      baseAmount: 0,
      cappedAmount: 0,
      appliedRules: [],
      finalAmount: 0,
    }
  }

  let totalCommission = 0
  const appliedRules: CalculationResult['appliedRules'] = []

  // Apply each rule
  for (const rule of rules) {
    let ruleAmount = 0
    let description = ''

    switch (rule.ruleType) {
      case 'PERCENTAGE':
        if (rule.percentage) {
          ruleAmount = saleAmount * (rule.percentage / 100)
          description = `${rule.percentage}% of $${saleAmount.toFixed(2)}`
        }
        break

      case 'FLAT_AMOUNT':
        if (rule.flatAmount) {
          ruleAmount = rule.flatAmount
          description = `Flat amount of $${rule.flatAmount.toFixed(2)}`
        }
        break

      case 'TIERED':
        if (rule.tierThreshold && rule.tierPercentage) {
          if (saleAmount <= rule.tierThreshold) {
            // Below threshold - use base percentage if available, or 0
            ruleAmount = rule.percentage
              ? saleAmount * (rule.percentage / 100)
              : 0
            description = `${rule.percentage || 0}% on $${saleAmount.toFixed(2)} (below $${rule.tierThreshold} threshold)`
          } else {
            // Above threshold
            const baseAmount = rule.percentage
              ? rule.tierThreshold * (rule.percentage / 100)
              : 0
            const tierAmount =
              (saleAmount - rule.tierThreshold) * (rule.tierPercentage / 100)
            ruleAmount = baseAmount + tierAmount
            description = `${rule.percentage || 0}% up to $${rule.tierThreshold}, then ${rule.tierPercentage}% on remaining $${(saleAmount - rule.tierThreshold).toFixed(2)}`
          }
        }
        break
    }

    // Apply min/max caps per rule if specified
    let cappedRuleAmount = ruleAmount

    if (rule.minAmount !== null && ruleAmount < rule.minAmount) {
      cappedRuleAmount = rule.minAmount
      description += ` (raised to minimum of $${rule.minAmount.toFixed(2)})`
    }

    if (rule.maxAmount !== null && ruleAmount > rule.maxAmount) {
      cappedRuleAmount = rule.maxAmount
      description += ` (capped at maximum of $${rule.maxAmount.toFixed(2)})`
    }

    appliedRules.push({
      ruleId: rule.id,
      ruleType: rule.ruleType,
      calculatedAmount: cappedRuleAmount,
      description,
    })

    totalCommission += cappedRuleAmount
  }

  return {
    baseAmount: appliedRules.reduce((sum, r) => sum + r.calculatedAmount, 0),
    cappedAmount: totalCommission,
    appliedRules,
    finalAmount: totalCommission,
  }
}

/**
 * Preview commission calculation for display
 */
export function previewCommission(
  saleAmount: number,
  rules: CommissionRule[]
): {
  saleAmount: number
  totalCommission: number
  rules: {
    type: string
    description: string
    amount: number
  }[]
} {
  const result = calculateCommission(saleAmount, rules)

  return {
    saleAmount,
    totalCommission: result.finalAmount,
    rules: result.appliedRules.map((r) => ({
      type: r.ruleType,
      description: r.description,
      amount: r.calculatedAmount,
    })),
  }
}

/**
 * Format rule for display
 */
export function formatRule(rule: CommissionRule): string {
  switch (rule.ruleType) {
    case 'PERCENTAGE':
      return `${rule.percentage}% of sale`

    case 'FLAT_AMOUNT':
      return `$${rule.flatAmount?.toFixed(2)} per sale`

    case 'TIERED':
      if (rule.percentage && rule.tierThreshold && rule.tierPercentage) {
        return `${rule.percentage}% up to $${rule.tierThreshold.toFixed(0)}, then ${rule.tierPercentage}% above`
      }
      return 'Tiered commission'

    default:
      return 'Unknown rule type'
  }
}

/**
 * Get rule type display name
 */
export function getRuleTypeLabel(ruleType: string): string {
  switch (ruleType) {
    case 'PERCENTAGE':
      return 'Percentage'
    case 'FLAT_AMOUNT':
      return 'Flat Amount'
    case 'TIERED':
      return 'Tiered'
    default:
      return ruleType
  }
}
