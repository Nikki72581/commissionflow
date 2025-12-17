import type {
  CommissionRule,
  CommissionBasis,
  CustomerTier,
  RuleScope,
  RulePriority,
} from '@prisma/client'
import { compareRulePrecedence } from './rule-precedence-validator'

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

export interface CalculationContext {
  // Transaction details
  grossAmount: number
  netAmount: number // After returns/credits
  transactionDate: Date

  // Contextual information
  customerId?: string
  customerTier?: CustomerTier
  projectId?: string
  productCategoryId?: string
  territoryId?: string

  // Basis selection
  commissionBasis: CommissionBasis
}

export interface EnhancedCalculationResult extends CalculationResult {
  basis: CommissionBasis
  basisAmount: number
  context: {
    customerTier?: CustomerTier
    productCategory?: string
    territory?: string
  }
}

export interface ScopedCommissionRule extends CommissionRule {
  scope: RuleScope
  priority: RulePriority
  customerTier: CustomerTier | null
  productCategoryId: string | null
  territoryId: string | null
  clientId: string | null
}

export interface PrecedenceCalculationResult extends EnhancedCalculationResult {
  selectedRule?: {
    id: string
    scope: RuleScope
    priority: RulePriority
    description: string
  }
  matchedRules: Array<{
    id: string
    scope: RuleScope
    priority: RulePriority
    selected: boolean
  }>
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

/**
 * Calculate commission with context (enhanced version)
 */
export function calculateCommissionWithContext(
  context: CalculationContext,
  rules: CommissionRule[]
): EnhancedCalculationResult {
  // Determine basis amount
  const basisAmount =
    context.commissionBasis === 'NET_SALES'
      ? context.netAmount
      : context.grossAmount

  // Use existing calculation logic
  const baseResult = calculateCommission(basisAmount, rules)

  // Return enhanced result
  return {
    ...baseResult,
    basis: context.commissionBasis,
    basisAmount,
    context: {
      customerTier: context.customerTier,
      productCategory: context.productCategoryId,
      territory: context.territoryId,
    },
  }
}

/**
 * Check if a scoped rule applies to the current transaction context
 */
export function ruleApplies(
  rule: ScopedCommissionRule,
  context: CalculationContext
): boolean {
  switch (rule.scope) {
    case 'GLOBAL':
      // Global rules always apply
      return true

    case 'CUSTOMER_TIER':
      // Must match customer tier
      return rule.customerTier === context.customerTier

    case 'PRODUCT_CATEGORY':
      // Must match product category
      return rule.productCategoryId === context.productCategoryId

    case 'TERRITORY':
      // Must match territory
      return rule.territoryId === context.territoryId

    case 'CUSTOMER_SPECIFIC':
      // Must match specific customer
      return rule.clientId === context.customerId

    default:
      return false
  }
}

/**
 * Filter and sort rules by applicability and precedence
 * Returns rules sorted by priority (highest first)
 */
export function getApplicableRules(
  rules: ScopedCommissionRule[],
  context: CalculationContext
): ScopedCommissionRule[] {
  // Filter to only applicable rules
  const applicable = rules.filter((rule) => ruleApplies(rule, context))

  // Sort by precedence (highest priority first, then newest first)
  return applicable.sort(compareRulePrecedence)
}

/**
 * Calculate commission with precedence hierarchy
 * Applies the highest-priority matching rule only
 */
export function calculateCommissionWithPrecedence(
  context: CalculationContext,
  rules: ScopedCommissionRule[]
): PrecedenceCalculationResult {
  // Get all applicable rules sorted by precedence
  const applicableRules = getApplicableRules(rules, context)

  // Track which rules matched
  const matchedRules = applicableRules.map((rule, index) => ({
    id: rule.id,
    scope: rule.scope,
    priority: rule.priority,
    selected: index === 0, // Only first rule is selected
  }))

  // Use highest priority rule (first in sorted list)
  const selectedRule = applicableRules[0]

  // If no rules apply, return zero commission
  if (!selectedRule) {
    return {
      baseAmount: 0,
      cappedAmount: 0,
      appliedRules: [],
      finalAmount: 0,
      basis: context.commissionBasis,
      basisAmount:
        context.commissionBasis === 'NET_SALES'
          ? context.netAmount
          : context.grossAmount,
      context: {
        customerTier: context.customerTier,
        productCategory: context.productCategoryId,
        territory: context.territoryId,
      },
      matchedRules,
    }
  }

  // Calculate using only the selected rule
  const basisAmount =
    context.commissionBasis === 'NET_SALES'
      ? context.netAmount
      : context.grossAmount

  const calculationResult = calculateCommission(basisAmount, [selectedRule])

  // Build scope description
  let scopeDescription = ''
  switch (selectedRule.scope) {
    case 'CUSTOMER_SPECIFIC':
      scopeDescription = 'Customer-specific rule'
      break
    case 'PRODUCT_CATEGORY':
      scopeDescription = 'Product category rule'
      break
    case 'TERRITORY':
      scopeDescription = 'Territory rule'
      break
    case 'CUSTOMER_TIER':
      scopeDescription = `${selectedRule.customerTier} tier rule`
      break
    case 'GLOBAL':
      scopeDescription = 'Global default rule'
      break
  }

  return {
    ...calculationResult,
    basis: context.commissionBasis,
    basisAmount,
    context: {
      customerTier: context.customerTier,
      productCategory: context.productCategoryId,
      territory: context.territoryId,
    },
    selectedRule: {
      id: selectedRule.id,
      scope: selectedRule.scope,
      priority: selectedRule.priority,
      description: scopeDescription,
    },
    matchedRules,
  }
}
