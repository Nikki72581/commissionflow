'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { RuleEvaluationTrace } from '@/types/commission-trace'

interface RuleTraceListProps {
  ruleTrace: RuleEvaluationTrace[]
  className?: string
}

function ConditionBadge({
  condition,
}: {
  condition: {
    field: string
    operator: string
    expected: unknown
    actual: unknown
    passed: boolean
  }
}) {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'none'
    if (typeof value === 'number') return value.toLocaleString()
    return String(value)
  }

  const operatorLabel: Record<string, string> = {
    equals: '=',
    greaterThanOrEqual: '>=',
    lessThanOrEqual: '<=',
    greaterThan: '>',
    lessThan: '<',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
        condition.passed
          ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
      )}
    >
      {condition.passed ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span className="font-medium">{condition.field}</span>
      <span>{operatorLabel[condition.operator] || condition.operator}</span>
      <span>{formatValue(condition.expected)}</span>
      {!condition.passed && (
        <span className="text-muted-foreground">(was: {formatValue(condition.actual)})</span>
      )}
    </div>
  )
}

function RuleTraceItem({ rule, index }: { rule: RuleEvaluationTrace; index: number }) {
  const [isOpen, setIsOpen] = useState(rule.selected)

  const priorityColors: Record<string, string> = {
    PROJECT_SPECIFIC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    CUSTOMER_SPECIFIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PRODUCT_CATEGORY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    TERRITORY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    CUSTOMER_TIER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    DEFAULT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  }

  const scopeLabels: Record<string, string> = {
    GLOBAL: 'Global',
    CUSTOMER_TIER: 'Customer Tier',
    PRODUCT_CATEGORY: 'Product Category',
    TERRITORY: 'Territory',
    CUSTOMER_SPECIFIC: 'Customer-Specific',
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'rounded-lg border',
          rule.selected
            ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
            : rule.eligible
              ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
              : 'border-muted bg-muted/30',
        )}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}

              <span className="text-sm text-muted-foreground">#{index + 1}</span>

              {rule.selected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : rule.eligible ? (
                <Circle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}

              <span className="font-medium text-left">
                {rule.description || rule.ruleName || `Rule ${rule.ruleId.slice(0, 8)}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', priorityColors[rule.priority])}>
                {rule.priority.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {scopeLabels[rule.scope] || rule.scope}
              </Badge>
              {rule.selected && (
                <Badge className="bg-green-600 hover:bg-green-600 text-xs">Selected</Badge>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4">
            {/* Conditions */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Conditions Evaluated
              </div>
              <div className="flex flex-wrap gap-2">
                {rule.conditions.map((condition, i) => (
                  <ConditionBadge key={i} condition={condition} />
                ))}
              </div>
            </div>

            {/* Calculation Details (only for selected rule) */}
            {rule.selected && rule.calculation && (
              <div className="rounded-md bg-white dark:bg-gray-900 p-3 border">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Calculation Breakdown
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Basis Type:</div>
                  <div className="font-medium">
                    {rule.calculation.basis === 'NET_SALES' ? 'Net Sales' : 'Gross Revenue'}
                  </div>

                  <div className="text-muted-foreground">Basis Amount:</div>
                  <div className="font-medium">{formatCurrency(rule.calculation.basisAmount)}</div>

                  {rule.calculation.rate !== undefined && (
                    <>
                      <div className="text-muted-foreground">Rate:</div>
                      <div className="font-medium">{rule.calculation.rate}%</div>
                    </>
                  )}

                  {rule.calculation.flatAmount !== undefined && (
                    <>
                      <div className="text-muted-foreground">Flat Amount:</div>
                      <div className="font-medium">
                        {formatCurrency(rule.calculation.flatAmount)}
                      </div>
                    </>
                  )}

                  <div className="text-muted-foreground">Raw Amount:</div>
                  <div className="font-medium">{formatCurrency(rule.calculation.rawAmount)}</div>

                  {(rule.calculation.minCap !== undefined ||
                    rule.calculation.maxCap !== undefined) && (
                    <>
                      <div className="text-muted-foreground">Caps:</div>
                      <div className="font-medium">
                        {rule.calculation.minCap !== undefined &&
                          `Min: ${formatCurrency(rule.calculation.minCap)}`}
                        {rule.calculation.minCap !== undefined &&
                          rule.calculation.maxCap !== undefined &&
                          ' / '}
                        {rule.calculation.maxCap !== undefined &&
                          `Max: ${formatCurrency(rule.calculation.maxCap)}`}
                      </div>
                    </>
                  )}

                  <div className="text-muted-foreground font-medium">Final Amount:</div>
                  <div className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(rule.calculation.finalAmount)}
                  </div>
                </div>
              </div>
            )}

            {/* Rule ID for reference */}
            <div className="text-xs text-muted-foreground">Rule ID: {rule.ruleId}</div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function RuleTraceList({ ruleTrace, className }: RuleTraceListProps) {
  if (!ruleTrace || ruleTrace.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No rule evaluation data available.
      </div>
    )
  }

  const selectedCount = ruleTrace.filter((r) => r.selected).length
  const eligibleCount = ruleTrace.filter((r) => r.eligible && !r.selected).length
  const notEligibleCount = ruleTrace.filter((r) => !r.eligible).length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>{selectedCount} selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-4 w-4 text-yellow-600" />
          <span>{eligibleCount} eligible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span>{notEligibleCount} not eligible</span>
        </div>
      </div>

      {/* Rule List */}
      <div className="space-y-2">
        {ruleTrace.map((rule, index) => (
          <RuleTraceItem key={rule.ruleId} rule={rule} index={index} />
        ))}
      </div>
    </div>
  )
}
