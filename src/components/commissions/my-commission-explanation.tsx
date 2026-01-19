'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Loader2, AlertCircle, DollarSign, Receipt, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AdjustmentsTimeline } from './explanation/AdjustmentsTimeline'
import { CalculationBreakdown } from './explanation/CalculationBreakdown'
import { getMyCommissionExplanation } from '@/app/actions/commission-explanations'
import type { CommissionExplanation } from '@/types/commission-trace'

interface MyCommissionExplanationProps {
  calculationId: string
  trigger?: React.ReactNode
}

/**
 * Simplified commission explanation view for salespeople.
 * Shows only information relevant to understanding their commission payout.
 */
export function MyCommissionExplanation({
  calculationId,
  trigger,
}: MyCommissionExplanationProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<CommissionExplanation | null>(null)

  // Fetch explanation when dialog opens
  useEffect(() => {
    if (open && !explanation) {
      setLoading(true)
      setError(null)

      getMyCommissionExplanation(calculationId)
        .then((result) => {
          if (result.success && result.data) {
            setExplanation(result.data)
          } else {
            setError(result.error || 'Failed to load explanation')
          }
        })
        .catch((err) => {
          setError(err.message || 'An error occurred')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, calculationId, explanation])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Lightbulb className="mr-2 h-4 w-4" />
            How was this calculated?
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Commission Breakdown
          </DialogTitle>
          <DialogDescription>
            Here's how your commission was calculated for this sale
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {explanation && !loading && (
          <div className="space-y-6">
            {/* Your Earnings Summary */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-green-700 dark:text-green-300 mb-1">
                    Your Commission
                  </div>
                  <div className="text-4xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(explanation.summary.commissionAmount)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {explanation.summary.effectiveRate.toFixed(1)}% of{' '}
                    {formatCurrency(explanation.summary.saleAmount)}
                  </div>
                  <div className="mt-3">
                    <Badge
                      variant={
                        explanation.summary.status === 'PAID'
                          ? 'default'
                          : explanation.summary.status === 'APPROVED'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-sm"
                    >
                      {explanation.summary.status === 'PAID'
                        ? 'Paid'
                        : explanation.summary.status === 'APPROVED'
                          ? 'Approved - Pending Payment'
                          : 'Pending Approval'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sale Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Sale Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Sale Amount</div>
                    <div className="font-semibold text-lg">
                      {formatCurrency(explanation.transaction.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {formatDate(explanation.transaction.date)}
                    </div>
                  </div>
                  {explanation.transaction.invoiceNumber && (
                    <div>
                      <div className="text-muted-foreground">Invoice</div>
                      <div className="font-medium">
                        {explanation.transaction.invoiceNumber}
                      </div>
                    </div>
                  )}
                  {explanation.transaction.clientName && (
                    <div>
                      <div className="text-muted-foreground">Client</div>
                      <div className="font-medium">
                        {explanation.transaction.clientName}
                      </div>
                    </div>
                  )}
                  {explanation.transaction.projectName && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Project</div>
                      <div className="font-medium">
                        {explanation.transaction.projectName}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* How It Was Calculated */}
            {explanation.appliedRule && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    How It Was Calculated
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      {explanation.appliedRule.description}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Commission Plan: {explanation.summary.planName}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {explanation.appliedRule.calculation.basisType}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(explanation.appliedRule.calculation.basisAmount)}
                      </span>
                    </div>

                    {explanation.appliedRule.rate !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Commission Rate</span>
                        <span className="font-medium">{explanation.appliedRule.rate}%</span>
                      </div>
                    )}

                    {explanation.appliedRule.flatAmount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Flat Commission</span>
                        <span className="font-medium">
                          {formatCurrency(explanation.appliedRule.flatAmount)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">Your Commission</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(explanation.appliedRule.calculation.finalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adjustments (if any) */}
            {explanation.adjustments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Adjustments
                    <Badge variant="secondary">{explanation.adjustments.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdjustmentsTimeline
                    adjustments={explanation.adjustments}
                    originalAmount={explanation.summary.commissionAmount}
                  />
                </CardContent>
              </Card>
            )}

            {/* Footer Note */}
            <div className="text-xs text-center text-muted-foreground">
              Calculated on {formatDate(explanation.summary.calculatedAt)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
