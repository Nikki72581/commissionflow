'use client'

import { ArrowDownRight, ArrowUpRight, RefreshCw, Users, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { CommissionAdjustmentTrace } from '@/types/commission-trace'

interface AdjustmentsTimelineProps {
  adjustments: CommissionAdjustmentTrace[]
  originalAmount: number
  className?: string
}

const adjustmentConfig: Record<
  string,
  {
    icon: typeof ArrowDownRight
    label: string
    colorClass: string
  }
> = {
  RETURN: {
    icon: ArrowDownRight,
    label: 'Return',
    colorClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
  },
  CLAWBACK: {
    icon: RefreshCw,
    label: 'Clawback',
    colorClass: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30',
  },
  OVERRIDE: {
    icon: ArrowUpRight,
    label: 'Override',
    colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
  },
  SPLIT_CREDIT: {
    icon: Users,
    label: 'Split Credit',
    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
  },
}

function AdjustmentItem({ adjustment }: { adjustment: CommissionAdjustmentTrace }) {
  const config = adjustmentConfig[adjustment.type] || {
    icon: RefreshCw,
    label: adjustment.type,
    colorClass: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30',
  }

  const Icon = config.icon
  const isNegative = adjustment.amount < 0

  return (
    <div className="flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            config.colorClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 w-px bg-border" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-xs', config.colorClass.replace('bg-', 'border-'))}
              >
                {config.label}
              </Badge>
              <span
                className={cn(
                  'font-semibold',
                  isNegative
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400',
                )}
              >
                {isNegative ? '-' : '+'}
                {formatCurrency(Math.abs(adjustment.amount))}
              </span>
            </div>

            {adjustment.reason && (
              <p className="mt-1 text-sm text-muted-foreground">{adjustment.reason}</p>
            )}

            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(adjustment.appliedAt)}</span>
              </div>
              {adjustment.appliedBy && <span>by {adjustment.appliedBy}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdjustmentsTimeline({
  adjustments,
  originalAmount,
  className,
}: AdjustmentsTimelineProps) {
  if (!adjustments || adjustments.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No adjustments have been made to this commission.
      </div>
    )
  }

  // Calculate totals
  const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
  const netAmount = originalAmount + totalAdjustments

  // Sort by date (newest first)
  const sortedAdjustments = [...adjustments].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Original</div>
            <div className="font-semibold">{formatCurrency(originalAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Adjustments</div>
            <div
              className={cn(
                'font-semibold',
                totalAdjustments < 0
                  ? 'text-red-600 dark:text-red-400'
                  : totalAdjustments > 0
                    ? 'text-green-600 dark:text-green-400'
                    : '',
              )}
            >
              {totalAdjustments >= 0 ? '+' : ''}
              {formatCurrency(totalAdjustments)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net Amount</div>
            <div className="font-bold text-lg">{formatCurrency(netAmount)}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sortedAdjustments.map((adjustment, index) => (
          <AdjustmentItem
            key={adjustment.id || index}
            adjustment={adjustment}
          />
        ))}
        {/* End cap */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-muted-foreground bg-background" />
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">Original calculation</div>
        </div>
      </div>
    </div>
  )
}
