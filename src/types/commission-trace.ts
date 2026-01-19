/**
 * Commission Calculation Trace Types
 *
 * These types define the structure for capturing comprehensive calculation traces
 * that enable the "Explain This Commission" feature.
 */

import type { CommissionBasis, CustomerTier, RuleScope, RulePriority } from '@prisma/client'

/**
 * Current version of the commission calculation engine.
 * Increment when calculation logic changes to track which version was used.
 */
export const ENGINE_VERSION = '1.0.0'

/**
 * Snapshot of plan information at calculation time
 */
export interface PlanVersionSnapshot {
  id: string
  name: string
  commissionBasis: CommissionBasis
  updatedAt: Date
}

/**
 * Snapshot of client information at calculation time
 */
export interface ClientSnapshot {
  id: string
  name: string
  tier: CustomerTier
}

/**
 * Snapshot of project information at calculation time
 */
export interface ProjectSnapshot {
  id: string
  name: string
}

/**
 * Snapshot of territory information at calculation time
 */
export interface TerritorySnapshot {
  id: string
  name: string
}

/**
 * Snapshot of product category information at calculation time
 */
export interface ProductCategorySnapshot {
  id: string
  name: string
}

/**
 * Snapshot of salesperson information at calculation time
 */
export interface SalespersonSnapshot {
  id: string
  name: string
  email?: string
}

/**
 * Complete input snapshot frozen at calculation time.
 * This allows accurate explanations even if source data changes later.
 */
export interface InputSnapshot {
  transactionId: string
  grossAmount: number
  netAmount: number
  transactionDate: Date
  transactionType: string
  invoiceNumber?: string
  description?: string
  client?: ClientSnapshot
  project?: ProjectSnapshot
  territory?: TerritorySnapshot
  productCategory?: ProductCategorySnapshot
  salesperson: SalespersonSnapshot
}

/**
 * A single condition evaluated during rule matching
 */
export interface RuleCondition {
  field: string // e.g., 'customerTier', 'saleAmount', 'territory'
  operator: string // e.g., 'equals', 'greaterThanOrEqual', 'lessThanOrEqual'
  expected: unknown // The value the rule requires
  actual: unknown // The actual value from the transaction
  passed: boolean // Whether this condition was satisfied
}

/**
 * Calculation details for a rule that was applied
 */
export interface RuleCalculationDetail {
  basis: CommissionBasis
  basisAmount: number
  rate?: number // For PERCENTAGE rules
  flatAmount?: number // For FLAT_AMOUNT rules
  rawAmount: number // Before caps
  minCap?: number
  maxCap?: number
  finalAmount: number // After caps
}

/**
 * Trace of a single rule's evaluation
 */
export interface RuleEvaluationTrace {
  ruleId: string
  ruleName?: string
  ruleType: string // PERCENTAGE, FLAT_AMOUNT
  scope: RuleScope
  priority: RulePriority
  description?: string
  conditions: RuleCondition[]
  eligible: boolean // Whether all conditions passed
  selected: boolean // Whether this rule was ultimately used
  calculation?: RuleCalculationDetail // Only present if selected
}

/**
 * Types of adjustments that can be applied to a commission
 */
export type AdjustmentType = 'RETURN' | 'CLAWBACK' | 'OVERRIDE' | 'SPLIT_CREDIT'

/**
 * An adjustment applied to a commission after initial calculation
 */
export interface CommissionAdjustmentTrace {
  id?: string
  type: AdjustmentType
  amount: number // Negative for deductions
  reason?: string
  relatedTransactionId?: string
  appliedAt: Date
  appliedBy?: string // User name who applied it
}

/**
 * Final output summary of the calculation
 */
export interface CalculationOutput {
  selectedRuleId?: string
  commissionAmount: number
  effectiveRate: number // commission / basisAmount as percentage
}

/**
 * Complete calculation trace stored in CommissionCalculation.metadata
 */
export interface CommissionCalculationTrace {
  // Versioning
  engineVersion: string
  planVersion: PlanVersionSnapshot

  // Input Snapshot
  inputSnapshot: InputSnapshot

  // Rule Evaluation Trace (ordered by priority)
  ruleTrace: RuleEvaluationTrace[]

  // Adjustments (populated as they occur)
  adjustments: CommissionAdjustmentTrace[]

  // Final Output
  output: CalculationOutput

  // Timestamps
  calculatedAt: Date

  // Recalculation tracking
  recalculated?: boolean
  previousTrace?: CommissionCalculationTrace
}

/**
 * Explanation data formatted for display to users.
 * Contains role-appropriate subsets of the full trace.
 */
export interface CommissionExplanation {
  // Always visible
  summary: {
    commissionAmount: number
    effectiveRate: number
    saleAmount: number
    planName: string
    calculatedAt: Date
    status: string
  }

  // Transaction details
  transaction: {
    id: string
    amount: number
    date: Date
    invoiceNumber?: string
    description?: string
    clientName?: string
    projectName?: string
  }

  // Applied rule info (simplified for salespeople)
  appliedRule?: {
    description: string
    ruleType: string
    rate?: number
    flatAmount?: number
    calculation: {
      basisType: string
      basisAmount: number
      rawAmount: number
      finalAmount: number
    }
  }

  // Adjustments affecting the payout
  adjustments: CommissionAdjustmentTrace[]

  // Admin-only fields
  adminDetails?: {
    engineVersion: string
    planVersion: PlanVersionSnapshot
    fullRuleTrace: RuleEvaluationTrace[]
    inputSnapshot: InputSnapshot
    internalNotes?: string
  }
}

/**
 * Options for building an explanation
 */
export interface ExplanationOptions {
  includeAdminDetails: boolean
  includeAdjustments: boolean
}
