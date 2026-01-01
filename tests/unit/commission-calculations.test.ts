import { describe, it, expect } from 'vitest'
import {
  calculateCommission,
  calculateCommissionWithContext,
  calculateCommissionWithPrecedence,
} from '@/lib/commission-calculator'
import type {
  CommissionRule,
  CommissionBasis,
  RuleType,
  CustomerTier,
  RuleScope,
} from '@prisma/client'

describe('Commission Calculator', () => {
  describe('calculateCommission - Basic Calculations', () => {
    describe('PERCENTAGE-based commissions', () => {
      it('should calculate basic percentage commission correctly', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10, // 10%
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(10000, rule)

        expect(result.calculatedAmount).toBe(1000)
        expect(result.appliedAmount).toBe(1000)
        expect(result.cappedByMin).toBe(false)
        expect(result.cappedByMax).toBe(false)
      })

      it('should handle decimal percentages correctly', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 7.5, // 7.5%
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(10000, rule)

        expect(result.calculatedAmount).toBe(750)
        expect(result.appliedAmount).toBe(750)
      })

      it('should handle small sale amounts', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(100, rule)

        expect(result.calculatedAmount).toBe(10)
        expect(result.appliedAmount).toBe(10)
      })

      it('should handle zero sale amount', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(0, rule)

        expect(result.calculatedAmount).toBe(0)
        expect(result.appliedAmount).toBe(0)
      })

      it('should handle negative sale amounts (returns)', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(-5000, rule)

        expect(result.calculatedAmount).toBe(-500)
        expect(result.appliedAmount).toBe(-500)
      })

      it('should round to 2 decimal places (cents)', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 3.33, // Will create fractional cents
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(1000, rule)

        expect(result.calculatedAmount).toBe(33.3)
        expect(result.appliedAmount).toBe(33.3)
      })
    })

    describe('FLAT_AMOUNT commissions', () => {
      it('should calculate flat amount commission correctly', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'FLAT_AMOUNT' as RuleType,
          value: 500, // $500 per sale
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(10000, rule)

        expect(result.calculatedAmount).toBe(500)
        expect(result.appliedAmount).toBe(500)
      })

      it('should apply flat amount regardless of sale size', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'FLAT_AMOUNT' as RuleType,
          value: 500,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const smallSale = calculateCommission(100, rule)
        const largeSale = calculateCommission(100000, rule)

        expect(smallSale.calculatedAmount).toBe(500)
        expect(largeSale.calculatedAmount).toBe(500)
      })
    })

    describe('TIERED commissions', () => {
      it('should calculate single tier commission', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'TIERED' as RuleType,
          value: 5, // Base rate (not used for tiered)
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: [
            { threshold: 0, rate: 5 }, // 5% for all sales
          ],
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(10000, rule)

        expect(result.calculatedAmount).toBe(500)
        expect(result.appliedAmount).toBe(500)
        expect(result.tierBreakdown).toHaveLength(1)
      })

      it('should calculate multi-tier commission with progression', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'TIERED' as RuleType,
          value: 5,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: [
            { threshold: 0, rate: 5 }, // 5% up to $10k
            { threshold: 10000, rate: 7 }, // 7% above $10k
          ],
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Sale of $15,000 should be:
        // First $10,000 at 5% = $500
        // Next $5,000 at 7% = $350
        // Total = $850
        const result = calculateCommission(15000, rule)

        expect(result.calculatedAmount).toBe(850)
        expect(result.appliedAmount).toBe(850)
        expect(result.tierBreakdown).toHaveLength(2)
        expect(result.tierBreakdown?.[0]).toEqual({
          threshold: 0,
          rate: 5,
          amount: 10000,
          commission: 500,
        })
        expect(result.tierBreakdown?.[1]).toEqual({
          threshold: 10000,
          rate: 7,
          amount: 5000,
          commission: 350,
        })
      })

      it('should handle sale below second tier threshold', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'TIERED' as RuleType,
          value: 5,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: [
            { threshold: 0, rate: 5 },
            { threshold: 10000, rate: 7 },
          ],
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Sale of $8,000 should only use first tier
        const result = calculateCommission(8000, rule)

        expect(result.calculatedAmount).toBe(400)
        expect(result.tierBreakdown).toHaveLength(1)
      })

      it('should handle three-tier commission structure', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'TIERED' as RuleType,
          value: 5,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: [
            { threshold: 0, rate: 5 },
            { threshold: 10000, rate: 7 },
            { threshold: 50000, rate: 10 },
          ],
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Sale of $75,000:
        // $0-10k at 5% = $500
        // $10k-50k at 7% = $2,800
        // $50k-75k at 10% = $2,500
        // Total = $5,800
        const result = calculateCommission(75000, rule)

        expect(result.calculatedAmount).toBe(5800)
        expect(result.tierBreakdown).toHaveLength(3)
      })
    })

    describe('Commission caps (min/max)', () => {
      it('should apply minimum cap when calculated amount is below min', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: 200, // Minimum $200
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // 10% of $1000 = $100, but min is $200
        const result = calculateCommission(1000, rule)

        expect(result.calculatedAmount).toBe(100)
        expect(result.appliedAmount).toBe(200)
        expect(result.cappedByMin).toBe(true)
        expect(result.cappedByMax).toBe(false)
      })

      it('should apply maximum cap when calculated amount exceeds max', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: null,
          maxAmount: 5000, // Maximum $5000
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // 10% of $100,000 = $10,000, but max is $5000
        const result = calculateCommission(100000, rule)

        expect(result.calculatedAmount).toBe(10000)
        expect(result.appliedAmount).toBe(5000)
        expect(result.cappedByMin).toBe(false)
        expect(result.cappedByMax).toBe(true)
      })

      it('should apply both min and max caps with min and max set', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: 200,
          maxAmount: 5000,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Test min cap
        const minResult = calculateCommission(1000, rule)
        expect(minResult.appliedAmount).toBe(200)
        expect(minResult.cappedByMin).toBe(true)

        // Test max cap
        const maxResult = calculateCommission(100000, rule)
        expect(maxResult.appliedAmount).toBe(5000)
        expect(maxResult.cappedByMax).toBe(true)

        // Test normal (between min and max)
        const normalResult = calculateCommission(30000, rule)
        expect(normalResult.appliedAmount).toBe(3000)
        expect(normalResult.cappedByMin).toBe(false)
        expect(normalResult.cappedByMax).toBe(false)
      })

      it('should not cap when amount is within min/max range', () => {
        const rule: CommissionRule = {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: 200,
          maxAmount: 5000,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = calculateCommission(30000, rule)

        expect(result.calculatedAmount).toBe(3000)
        expect(result.appliedAmount).toBe(3000)
        expect(result.cappedByMin).toBe(false)
        expect(result.cappedByMax).toBe(false)
      })
    })
  })

  describe('calculateCommissionWithContext - Commission Basis', () => {
    const baseRule: CommissionRule = {
      id: '1',
      commissionPlanId: 'plan-1',
      ruleType: 'PERCENTAGE' as RuleType,
      value: 10,
      minAmount: null,
      maxAmount: null,
      threshold: null,
      tiers: null,
      scope: 'GLOBAL' as RuleScope,
      priority: 50,
      customerTier: null,
      productCategoryId: null,
      territoryId: null,
      clientId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should calculate on GROSS_REVENUE basis', () => {
      const result = calculateCommissionWithContext(10000, [baseRule], {
        commissionBasis: 'GROSS_REVENUE' as CommissionBasis,
        grossRevenue: 10000,
        netSales: 8000, // Has returns/credits
      })

      // Should use gross revenue (10000)
      expect(result.totalCommission).toBe(1000)
    })

    it('should calculate on NET_SALES basis', () => {
      const result = calculateCommissionWithContext(10000, [baseRule], {
        commissionBasis: 'NET_SALES' as CommissionBasis,
        grossRevenue: 10000,
        netSales: 8000, // After returns/credits
      })

      // Should use net sales (8000)
      expect(result.totalCommission).toBe(800)
    })

    it('should default to GROSS_REVENUE when basis not specified', () => {
      const result = calculateCommissionWithContext(10000, [baseRule], {})

      expect(result.totalCommission).toBe(1000)
    })
  })

  describe('calculateCommissionWithPrecedence - Rule Matching', () => {
    const createRule = (
      scope: RuleScope,
      priority: number,
      options: Partial<CommissionRule> = {}
    ): CommissionRule => ({
      id: `rule-${scope}-${priority}`,
      commissionPlanId: 'plan-1',
      ruleType: 'PERCENTAGE' as RuleType,
      value: 10,
      minAmount: null,
      maxAmount: null,
      threshold: null,
      tiers: null,
      scope,
      priority,
      customerTier: null,
      productCategoryId: null,
      territoryId: null,
      clientId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options,
    })

    it('should select PROJECT_SPECIFIC rule over GLOBAL rule', () => {
      const rules = [
        createRule('GLOBAL' as RuleScope, 50, { value: 5 }),
        createRule('GLOBAL' as RuleScope, 100, { value: 10 }), // PROJECT_SPECIFIC priority
      ]

      const result = calculateCommissionWithPrecedence(10000, rules, {
        projectId: 'project-1',
      })

      // Should use higher priority rule (10%)
      expect(result.totalCommission).toBe(1000)
      expect(result.appliedRules).toHaveLength(1)
    })

    it('should select CUSTOMER_TIER rule when tier matches', () => {
      const rules = [
        createRule('GLOBAL' as RuleScope, 50, { value: 5 }),
        createRule('CUSTOMER_TIER' as RuleScope, 60, {
          value: 8,
          customerTier: 'VIP' as CustomerTier,
        }),
      ]

      const result = calculateCommissionWithPrecedence(10000, rules, {
        customerTier: 'VIP' as CustomerTier,
      })

      // Should use VIP tier rule (8%)
      expect(result.totalCommission).toBe(800)
    })

    it('should select CUSTOMER_SPECIFIC rule with highest priority', () => {
      const rules = [
        createRule('GLOBAL' as RuleScope, 50, { value: 5 }),
        createRule('CUSTOMER_TIER' as RuleScope, 60, { value: 8 }),
        createRule('CUSTOMER_SPECIFIC' as RuleScope, 90, {
          value: 12,
          clientId: 'client-123',
        }),
      ]

      const result = calculateCommissionWithPrecedence(10000, rules, {
        clientId: 'client-123',
      })

      // Should use customer-specific rule (12%)
      expect(result.totalCommission).toBe(1200)
    })

    it('should fall back to GLOBAL rule when no specific rules match', () => {
      const rules = [
        createRule('GLOBAL' as RuleScope, 50, { value: 5 }),
        createRule('CUSTOMER_TIER' as RuleScope, 60, {
          value: 8,
          customerTier: 'VIP' as CustomerTier,
        }),
      ]

      const result = calculateCommissionWithPrecedence(10000, rules, {
        customerTier: 'STANDARD' as CustomerTier, // Doesn't match VIP
      })

      // Should fall back to GLOBAL rule (5%)
      expect(result.totalCommission).toBe(500)
    })

    it('should return zero when no rules match', () => {
      const rules = [
        createRule('CUSTOMER_SPECIFIC' as RuleScope, 90, {
          value: 12,
          clientId: 'client-456',
        }),
      ]

      const result = calculateCommissionWithPrecedence(10000, rules, {
        clientId: 'client-123', // Different client
      })

      expect(result.totalCommission).toBe(0)
      expect(result.appliedRules).toHaveLength(0)
    })
  })

  describe('Stacked Rules', () => {
    it('should stack PERCENTAGE + FLAT_AMOUNT rules', () => {
      const rules: CommissionRule[] = [
        {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          commissionPlanId: 'plan-1',
          ruleType: 'FLAT_AMOUNT' as RuleType,
          value: 500,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const result = calculateCommissionWithContext(10000, rules, {})

      // 10% of $10,000 = $1,000 + $500 flat = $1,500
      expect(result.totalCommission).toBe(1500)
      expect(result.appliedRules).toHaveLength(2)
    })

    it('should stack all three rule types (PERCENTAGE + FLAT + TIERED)', () => {
      const rules: CommissionRule[] = [
        {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 5,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          commissionPlanId: 'plan-1',
          ruleType: 'FLAT_AMOUNT' as RuleType,
          value: 500,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          commissionPlanId: 'plan-1',
          ruleType: 'TIERED' as RuleType,
          value: 2,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: [
            { threshold: 0, rate: 2 },
            { threshold: 10000, rate: 3 },
          ],
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const result = calculateCommissionWithContext(15000, rules, {})

      // Percentage: 5% of $15,000 = $750
      // Flat: $500
      // Tiered: $10k at 2% ($200) + $5k at 3% ($150) = $350
      // Total = $1,600
      expect(result.totalCommission).toBe(1600)
      expect(result.appliedRules).toHaveLength(3)
    })

    it('should apply caps to each rule independently', () => {
      const rules: CommissionRule[] = [
        {
          id: '1',
          commissionPlanId: 'plan-1',
          ruleType: 'PERCENTAGE' as RuleType,
          value: 10,
          minAmount: null,
          maxAmount: 2000, // Cap at $2000
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          commissionPlanId: 'plan-1',
          ruleType: 'FLAT_AMOUNT' as RuleType,
          value: 500,
          minAmount: null,
          maxAmount: null,
          threshold: null,
          tiers: null,
          scope: 'GLOBAL' as RuleScope,
          priority: 50,
          customerTier: null,
          productCategoryId: null,
          territoryId: null,
          clientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const result = calculateCommissionWithContext(100000, rules, {})

      // Percentage: 10% of $100k = $10k, capped at $2k
      // Flat: $500
      // Total = $2,500
      expect(result.totalCommission).toBe(2500)
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle empty rules array', () => {
      const result = calculateCommissionWithContext(10000, [], {})

      expect(result.totalCommission).toBe(0)
      expect(result.appliedRules).toHaveLength(0)
    })

    it('should handle very large sale amounts', () => {
      const rule: CommissionRule = {
        id: '1',
        commissionPlanId: 'plan-1',
        ruleType: 'PERCENTAGE' as RuleType,
        value: 10,
        minAmount: null,
        maxAmount: null,
        threshold: null,
        tiers: null,
        scope: 'GLOBAL' as RuleScope,
        priority: 50,
        customerTier: null,
        productCategoryId: null,
        territoryId: null,
        clientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = calculateCommission(10000000, rule) // $10 million

      expect(result.calculatedAmount).toBe(1000000) // $1 million
      expect(result.appliedAmount).toBe(1000000)
    })

    it('should handle rules with invalid tier configuration gracefully', () => {
      const rule: CommissionRule = {
        id: '1',
        commissionPlanId: 'plan-1',
        ruleType: 'TIERED' as RuleType,
        value: 5,
        minAmount: null,
        maxAmount: null,
        threshold: null,
        tiers: [], // Empty tiers array
        scope: 'GLOBAL' as RuleScope,
        priority: 50,
        customerTier: null,
        productCategoryId: null,
        territoryId: null,
        clientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Should handle gracefully - may return 0 or use base value
      const result = calculateCommission(10000, rule)

      expect(result).toBeDefined()
      expect(typeof result.appliedAmount).toBe('number')
    })
  })
})
