import type {
  CommissionRule,
  CommissionBasis,
  CustomerTier,
  RuleScope,
  RulePriority,
} from "@prisma/client";
import { compareRulePrecedence } from "./rule-precedence-validator";
import {
  ENGINE_VERSION,
  type CommissionCalculationTrace,
  type RuleEvaluationTrace,
  type RuleCondition,
  type RuleCalculationDetail,
  type InputSnapshot,
  type PlanVersionSnapshot,
} from "@/types/commission-trace";

export { ENGINE_VERSION };

export interface CalculationResult {
  baseAmount: number;
  cappedAmount: number;
  appliedRules: {
    ruleId: string;
    ruleType: string;
    calculatedAmount: number;
    description: string;
  }[];
  finalAmount: number;
}

export interface CalculationContext {
  // Transaction details
  grossAmount: number;
  netAmount: number; // After returns/credits
  transactionDate: Date;

  // Contextual information
  customerId?: string;
  customerTier?: CustomerTier;
  projectId?: string;
  productCategoryId?: string;
  territoryId?: string;

  // Basis selection
  commissionBasis: CommissionBasis;
}

/**
 * Extended calculation context with full entity snapshots for trace building
 */
export interface ExtendedCalculationContext extends CalculationContext {
  // Transaction identifiers
  transactionId: string;
  transactionType: string;
  invoiceNumber?: string;
  description?: string;

  // Full entity snapshots for the trace
  client?: {
    id: string;
    name: string;
    tier: CustomerTier;
  };
  project?: {
    id: string;
    name: string;
  };
  territory?: {
    id: string;
    name: string;
  };
  productCategory?: {
    id: string;
    name: string;
  };
  salesperson: {
    id: string;
    name: string;
    email?: string;
  };

  // Plan information for versioning
  plan: {
    id: string;
    name: string;
    commissionBasis: CommissionBasis;
    updatedAt: Date;
  };
}

export interface EnhancedCalculationResult extends CalculationResult {
  basis: CommissionBasis;
  basisAmount: number;
  context: {
    customerTier?: CustomerTier;
    productCategory?: string;
    territory?: string;
  };
}

export interface ScopedCommissionRule extends CommissionRule {
  scope: RuleScope;
  priority: RulePriority;
  customerTier: CustomerTier | null;
  productCategoryId: string | null;
  territoryId: string | null;
  clientId: string | null;
  minSaleAmount: number | null;
  maxSaleAmount: number | null;
}

export interface PrecedenceCalculationResult extends EnhancedCalculationResult {
  selectedRule?: {
    id: string;
    scope: RuleScope;
    priority: RulePriority;
    description: string;
  };
  matchedRules: Array<{
    id: string;
    scope: RuleScope;
    priority: RulePriority;
    selected: boolean;
  }>;
}

/**
 * Calculate commission based on a set of rules
 */
export function calculateCommission(
  saleAmount: number,
  rules: CommissionRule[],
): CalculationResult {
  if (rules.length === 0) {
    return {
      baseAmount: 0,
      cappedAmount: 0,
      appliedRules: [],
      finalAmount: 0,
    };
  }

  let totalCommission = 0;
  const appliedRules: CalculationResult["appliedRules"] = [];

  // Apply each rule
  for (const rule of rules) {
    let ruleAmount = 0;
    let description = "";

    switch (rule.ruleType) {
      case "PERCENTAGE":
        if (rule.percentage) {
          ruleAmount = saleAmount * (rule.percentage / 100);
          description = `${rule.percentage}% of $${saleAmount.toFixed(2)}`;
        }
        break;

      case "FLAT_AMOUNT":
        if (rule.flatAmount) {
          ruleAmount = rule.flatAmount;
          description = `Flat amount of $${rule.flatAmount.toFixed(2)}`;
        }
        break;

      case "TIERED":
        // DEPRECATED: TIERED rules have been migrated to PERCENTAGE rules with amount ranges
        console.warn(
          `Encountered deprecated TIERED rule (ID: ${rule.id}). This should have been migrated. Skipping calculation.`,
        );
        description =
          "[DEPRECATED] Tiered rule - please migrate to amount-based rules";
        ruleAmount = 0;
        break;

      default:
        console.warn(
          `Unsupported rule type: ${rule.ruleType}. Rule ID: ${rule.id}`,
        );
        break;
    }

    // Apply min/max caps per rule if specified
    let cappedRuleAmount = ruleAmount;

    if (rule.minAmount !== null && ruleAmount < rule.minAmount) {
      cappedRuleAmount = rule.minAmount;
      description += ` (raised to minimum of $${rule.minAmount.toFixed(2)})`;
    }

    if (rule.maxAmount !== null && ruleAmount > rule.maxAmount) {
      cappedRuleAmount = rule.maxAmount;
      description += ` (capped at maximum of $${rule.maxAmount.toFixed(2)})`;
    }

    appliedRules.push({
      ruleId: rule.id,
      ruleType: rule.ruleType,
      calculatedAmount: cappedRuleAmount,
      description,
    });

    totalCommission += cappedRuleAmount;
  }

  return {
    baseAmount: appliedRules.reduce((sum, r) => sum + r.calculatedAmount, 0),
    cappedAmount: totalCommission,
    appliedRules,
    finalAmount: totalCommission,
  };
}

/**
 * Preview commission calculation for display
 */
export function previewCommission(
  saleAmount: number,
  rules: CommissionRule[],
): {
  saleAmount: number;
  totalCommission: number;
  rules: {
    type: string;
    description: string;
    amount: number;
  }[];
} {
  const result = calculateCommission(saleAmount, rules);

  return {
    saleAmount,
    totalCommission: result.finalAmount,
    rules: result.appliedRules.map((r) => ({
      type: r.ruleType,
      description: r.description,
      amount: r.calculatedAmount,
    })),
  };
}

/**
 * Format rule for display
 */
export function formatRule(rule: CommissionRule): string {
  // Build amount range description first
  let rangeDesc = "";
  if (rule.minSaleAmount !== null || rule.maxSaleAmount !== null) {
    if (rule.minSaleAmount !== null && rule.maxSaleAmount !== null) {
      rangeDesc = ` (sales $${rule.minSaleAmount.toFixed(0)}-$${rule.maxSaleAmount.toFixed(0)})`;
    } else if (rule.minSaleAmount !== null) {
      rangeDesc = ` (sales $${rule.minSaleAmount.toFixed(0)}+)`;
    } else if (rule.maxSaleAmount !== null) {
      rangeDesc = ` (sales ≤$${rule.maxSaleAmount.toFixed(0)})`;
    }
  }

  switch (rule.ruleType) {
    case "PERCENTAGE":
      return `${rule.percentage}% of sale${rangeDesc}`;

    case "FLAT_AMOUNT":
      return `$${rule.flatAmount?.toFixed(2)} per sale${rangeDesc}`;

    case "TIERED":
      return "[DEPRECATED] Tiered rule - please migrate to amount-based rules";

    default:
      return "Unknown rule type";
  }
}

/**
 * Get rule type display name
 */
export function getRuleTypeLabel(ruleType: string): string {
  switch (ruleType) {
    case "PERCENTAGE":
      return "Percentage";
    case "FLAT_AMOUNT":
      return "Flat Amount";
    case "TIERED":
      return "Tiered";
    default:
      return ruleType;
  }
}

/**
 * Calculate commission with context (enhanced version)
 */
export function calculateCommissionWithContext(
  context: CalculationContext,
  rules: CommissionRule[],
): EnhancedCalculationResult {
  // Determine basis amount
  const basisAmount =
    context.commissionBasis === "NET_SALES"
      ? context.netAmount
      : context.grossAmount;

  // Use existing calculation logic
  const baseResult = calculateCommission(basisAmount, rules);

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
  };
}

/**
 * Check if a scoped rule applies to the current transaction context
 */
export function ruleApplies(
  rule: ScopedCommissionRule,
  context: CalculationContext,
): boolean {
  // FIRST: Check amount range filters (if set)
  const saleAmount =
    context.commissionBasis === "NET_SALES"
      ? context.netAmount
      : context.grossAmount;

  // If minSaleAmount is set, sale must be >= min
  if (rule.minSaleAmount !== null && saleAmount < rule.minSaleAmount) {
    return false;
  }

  // If maxSaleAmount is set, sale must be <= max
  if (rule.maxSaleAmount !== null && saleAmount > rule.maxSaleAmount) {
    return false;
  }

  // THEN: Check scope matching (existing logic)
  switch (rule.scope) {
    case "GLOBAL":
      // Global rules always apply
      return true;

    case "CUSTOMER_TIER":
      // Must match customer tier
      return rule.customerTier === context.customerTier;

    case "PRODUCT_CATEGORY":
      // Must match product category
      return rule.productCategoryId === context.productCategoryId;

    case "TERRITORY":
      // Must match territory
      return rule.territoryId === context.territoryId;

    case "CUSTOMER_SPECIFIC":
      // Must match specific customer
      return rule.clientId === context.customerId;

    default:
      return false;
  }
}

/**
 * Filter and sort rules by applicability and precedence
 * Returns rules sorted by priority (highest first)
 */
export function getApplicableRules(
  rules: ScopedCommissionRule[],
  context: CalculationContext,
): ScopedCommissionRule[] {
  // Filter to only applicable rules
  const applicable = rules.filter((rule) => ruleApplies(rule, context));

  // Sort by precedence (highest priority first, then newest first)
  return applicable.sort(compareRulePrecedence);
}

/**
 * Calculate commission with precedence hierarchy
 * Applies the highest-priority matching rule only
 */
export function calculateCommissionWithPrecedence(
  context: CalculationContext,
  rules: ScopedCommissionRule[],
): PrecedenceCalculationResult {
  // Get all applicable rules sorted by precedence
  const applicableRules = getApplicableRules(rules, context);

  // Track which rules matched
  const matchedRules = applicableRules.map((rule, index) => ({
    id: rule.id,
    scope: rule.scope,
    priority: rule.priority,
    selected: index === 0, // Only first rule is selected
  }));

  // Use highest priority rule (first in sorted list)
  const selectedRule = applicableRules[0];

  // If no rules apply, return zero commission
  if (!selectedRule) {
    return {
      baseAmount: 0,
      cappedAmount: 0,
      appliedRules: [],
      finalAmount: 0,
      basis: context.commissionBasis,
      basisAmount:
        context.commissionBasis === "NET_SALES"
          ? context.netAmount
          : context.grossAmount,
      context: {
        customerTier: context.customerTier,
        productCategory: context.productCategoryId,
        territory: context.territoryId,
      },
      matchedRules,
    };
  }

  // Calculate using only the selected rule
  const basisAmount =
    context.commissionBasis === "NET_SALES"
      ? context.netAmount
      : context.grossAmount;

  const calculationResult = calculateCommission(basisAmount, [selectedRule]);

  // Build scope description
  let scopeDescription = "";
  switch (selectedRule.scope) {
    case "CUSTOMER_SPECIFIC":
      scopeDescription = "Customer-specific rule";
      break;
    case "PRODUCT_CATEGORY":
      scopeDescription = "Product category rule";
      break;
    case "TERRITORY":
      scopeDescription = "Territory rule";
      break;
    case "CUSTOMER_TIER":
      scopeDescription = `${selectedRule.customerTier} tier rule`;
      break;
    case "GLOBAL":
      scopeDescription = "Global default rule";
      break;
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
  };
}

// ============================================
// TRACE BUILDING FUNCTIONS
// ============================================

/**
 * Build detailed condition evaluations for a rule
 */
function buildRuleConditions(
  rule: ScopedCommissionRule,
  context: CalculationContext,
): RuleCondition[] {
  const conditions: RuleCondition[] = [];
  const saleAmount =
    context.commissionBasis === "NET_SALES"
      ? context.netAmount
      : context.grossAmount;

  // Check amount range conditions
  if (rule.minSaleAmount !== null) {
    conditions.push({
      field: "saleAmount",
      operator: "greaterThanOrEqual",
      expected: rule.minSaleAmount,
      actual: saleAmount,
      passed: saleAmount >= rule.minSaleAmount,
    });
  }

  if (rule.maxSaleAmount !== null) {
    conditions.push({
      field: "saleAmount",
      operator: "lessThanOrEqual",
      expected: rule.maxSaleAmount,
      actual: saleAmount,
      passed: saleAmount <= rule.maxSaleAmount,
    });
  }

  // Check scope-specific conditions
  switch (rule.scope) {
    case "GLOBAL":
      conditions.push({
        field: "scope",
        operator: "equals",
        expected: "GLOBAL",
        actual: "GLOBAL",
        passed: true,
      });
      break;

    case "CUSTOMER_TIER":
      conditions.push({
        field: "customerTier",
        operator: "equals",
        expected: rule.customerTier,
        actual: context.customerTier ?? null,
        passed: rule.customerTier === context.customerTier,
      });
      break;

    case "PRODUCT_CATEGORY":
      conditions.push({
        field: "productCategoryId",
        operator: "equals",
        expected: rule.productCategoryId,
        actual: context.productCategoryId ?? null,
        passed: rule.productCategoryId === context.productCategoryId,
      });
      break;

    case "TERRITORY":
      conditions.push({
        field: "territoryId",
        operator: "equals",
        expected: rule.territoryId,
        actual: context.territoryId ?? null,
        passed: rule.territoryId === context.territoryId,
      });
      break;

    case "CUSTOMER_SPECIFIC":
      conditions.push({
        field: "customerId",
        operator: "equals",
        expected: rule.clientId,
        actual: context.customerId ?? null,
        passed: rule.clientId === context.customerId,
      });
      break;
  }

  return conditions;
}

/**
 * Build calculation details for a selected rule
 */
function buildRuleCalculationDetail(
  rule: ScopedCommissionRule,
  basisAmount: number,
  commissionBasis: CommissionBasis,
): RuleCalculationDetail {
  let rawAmount = 0;

  switch (rule.ruleType) {
    case "PERCENTAGE":
      if (rule.percentage) {
        rawAmount = basisAmount * (rule.percentage / 100);
      }
      break;
    case "FLAT_AMOUNT":
      if (rule.flatAmount) {
        rawAmount = rule.flatAmount;
      }
      break;
  }

  let finalAmount = rawAmount;

  if (rule.minAmount !== null && finalAmount < rule.minAmount) {
    finalAmount = rule.minAmount;
  }

  if (rule.maxAmount !== null && finalAmount > rule.maxAmount) {
    finalAmount = rule.maxAmount;
  }

  return {
    basis: commissionBasis,
    basisAmount,
    rate:
      rule.ruleType === "PERCENTAGE"
        ? (rule.percentage ?? undefined)
        : undefined,
    flatAmount:
      rule.ruleType === "FLAT_AMOUNT"
        ? (rule.flatAmount ?? undefined)
        : undefined,
    rawAmount,
    minCap: rule.minAmount ?? undefined,
    maxCap: rule.maxAmount ?? undefined,
    finalAmount,
  };
}

/**
 * Build a complete rule evaluation trace for all rules
 */
function buildRuleTrace(
  rules: ScopedCommissionRule[],
  context: CalculationContext,
  selectedRuleId?: string,
): RuleEvaluationTrace[] {
  const basisAmount =
    context.commissionBasis === "NET_SALES"
      ? context.netAmount
      : context.grossAmount;

  // Sort rules by precedence for display
  const sortedRules = [...rules].sort(compareRulePrecedence);

  return sortedRules.map((rule) => {
    const conditions = buildRuleConditions(rule, context);
    const eligible = conditions.every((c) => c.passed);
    const selected = rule.id === selectedRuleId;

    const trace: RuleEvaluationTrace = {
      ruleId: rule.id,
      ruleName: rule.description ?? undefined,
      ruleType: rule.ruleType,
      scope: rule.scope,
      priority: rule.priority,
      description: formatRule(rule),
      conditions,
      eligible,
      selected,
    };

    // Only include calculation detail for the selected rule
    if (selected) {
      trace.calculation = buildRuleCalculationDetail(
        rule,
        basisAmount,
        context.commissionBasis,
      );
    }

    return trace;
  });
}

/**
 * Build input snapshot from extended context
 */
function buildInputSnapshot(
  context: ExtendedCalculationContext,
): InputSnapshot {
  return {
    transactionId: context.transactionId,
    grossAmount: context.grossAmount,
    netAmount: context.netAmount,
    transactionDate: context.transactionDate,
    transactionType: context.transactionType,
    invoiceNumber: context.invoiceNumber,
    description: context.description,
    client: context.client,
    project: context.project,
    territory: context.territory,
    productCategory: context.productCategory,
    salesperson: context.salesperson,
  };
}

/**
 * Build plan version snapshot
 */
function buildPlanVersionSnapshot(
  context: ExtendedCalculationContext,
): PlanVersionSnapshot {
  return {
    id: context.plan.id,
    name: context.plan.name,
    commissionBasis: context.plan.commissionBasis,
    updatedAt: context.plan.updatedAt,
  };
}

/**
 * Calculate commission with full trace for "Explain This Commission" feature.
 * This is the primary function to use when creating new commission calculations.
 */
export function calculateCommissionWithTrace(
  context: ExtendedCalculationContext,
  rules: ScopedCommissionRule[],
): { result: PrecedenceCalculationResult; trace: CommissionCalculationTrace } {
  // Perform the standard calculation
  const result = calculateCommissionWithPrecedence(context, rules);

  // Build comprehensive trace
  const basisAmount =
    context.commissionBasis === "NET_SALES"
      ? context.netAmount
      : context.grossAmount;

  const effectiveRate =
    basisAmount > 0 ? (result.finalAmount / basisAmount) * 100 : 0;

  const trace: CommissionCalculationTrace = {
    engineVersion: ENGINE_VERSION,
    planVersion: buildPlanVersionSnapshot(context),
    inputSnapshot: buildInputSnapshot(context),
    ruleTrace: buildRuleTrace(rules, context, result.selectedRule?.id),
    adjustments: [], // Populated later when adjustments are added
    output: {
      selectedRuleId: result.selectedRule?.id,
      commissionAmount: result.finalAmount,
      effectiveRate,
    },
    calculatedAt: new Date(),
  };

  return { result, trace };
}
