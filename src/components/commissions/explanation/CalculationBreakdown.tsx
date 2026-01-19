'use client'

import { ArrowRight, Calculator, Percent, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface CalculationBreakdownProps {
  basisType: string
  basisAmount: number
  rate?: number
  flatAmount?: number
  rawAmount: number
  finalAmount: number
  minCap?: number
  maxCap?: number
  className?: string
}

export function CalculationBreakdown({
  basisType,
  basisAmount,
  rate,
  flatAmount,
  rawAmount,
  finalAmount,
  minCap,
  maxCap,
  className,
}: CalculationBreakdownProps) {
  const hasRateCalculation = rate !== undefined
  const hasFlatCalculation = flatAmount !== undefined
  const hasCaps = minCap !== undefined || maxCap !== undefined
  const wasAdjustedByCap = rawAmount !== finalAmount

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Calculation Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Step 1: Basis */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Commission Basis ({basisType})</div>
              <div className="font-semibold text-lg">{formatCurrency(basisAmount)}</div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Step 2: Rate/Flat Calculation */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              {hasRateCalculation && (
                <>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Apply Rate: {rate}%
                  </div>
                  <div className="font-medium">
                    {formatCurrency(basisAmount)} × {rate}% = {formatCurrency(rawAmount)}
                  </div>
                </>
              )}
              {hasFlatCalculation && (
                <>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Flat Amount
                  </div>
                  <div className="font-medium">{formatCurrency(flatAmount)}</div>
                </>
              )}
            </div>
          </div>

          {/* Step 3: Caps (if applicable) */}
          {hasCaps && (
            <>
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    wasAdjustedByCap
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
                  )}
                >
                  3
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    Apply Caps
                    {minCap !== undefined && ` (Min: ${formatCurrency(minCap)})`}
                    {maxCap !== undefined && ` (Max: ${formatCurrency(maxCap)})`}
                  </div>
                  {wasAdjustedByCap ? (
                    <div className="font-medium text-orange-600 dark:text-orange-400">
                      {formatCurrency(rawAmount)} → {formatCurrency(finalAmount)}
                      {rawAmount < finalAmount && ' (raised to minimum)'}
                      {rawAmount > finalAmount && ' (capped at maximum)'}
                    </div>
                  ) : (
                    <div className="font-medium text-muted-foreground">
                      No adjustment needed
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Final Result */}
          <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white text-sm font-semibold">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-green-700 dark:text-green-300">Final Commission</div>
              <div className="font-bold text-2xl text-green-700 dark:text-green-300">
                {formatCurrency(finalAmount)}
              </div>
            </div>
          </div>

          {/* Effective Rate */}
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            Effective Rate:{' '}
            <span className="font-semibold">
              {basisAmount > 0 ? ((finalAmount / basisAmount) * 100).toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
