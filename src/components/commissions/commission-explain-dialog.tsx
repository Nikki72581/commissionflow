'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Loader2, AlertCircle, FileText, ListChecks, Clock, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  RuleTraceList,
  AdjustmentsTimeline,
  InputSnapshotCard,
  CalculationBreakdown,
} from './explanation'
import { getCommissionExplanation } from '@/app/actions/commission-explanations'
import type { CommissionExplanation } from '@/types/commission-trace'

interface CommissionExplainDialogProps {
  calculationId: string
  trigger?: React.ReactNode
}

export function CommissionExplainDialog({
  calculationId,
  trigger,
}: CommissionExplainDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<CommissionExplanation | null>(null)

  // Fetch explanation when dialog opens
  useEffect(() => {
    if (open && !explanation) {
      setLoading(true)
      setError(null)

      getCommissionExplanation(calculationId)
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

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Keep explanation cached for potential re-open
    }
  }

  const isAdmin = explanation?.adminDetails !== undefined

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Lightbulb className="mr-2 h-4 w-4" />
            Explain
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Commission Explanation
          </DialogTitle>
          <DialogDescription>
            Understand how this commission was calculated
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
            {/* Summary Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Sale Amount</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(explanation.summary.saleAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Commission</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(explanation.summary.commissionAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Effective Rate</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {explanation.summary.effectiveRate.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="pt-1">
                      <Badge
                        variant={
                          explanation.summary.status === 'PAID'
                            ? 'default'
                            : explanation.summary.status === 'APPROVED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {explanation.summary.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Plan</div>
                    <div className="font-medium">{explanation.summary.planName}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Calculated</div>
                    <div className="font-medium">{formatDate(explanation.summary.calculatedAt)}</div>
                  </div>
                  {explanation.transaction.invoiceNumber && (
                    <div>
                      <div className="text-muted-foreground">Invoice</div>
                      <div className="font-medium">{explanation.transaction.invoiceNumber}</div>
                    </div>
                  )}
                  {explanation.transaction.clientName && (
                    <div>
                      <div className="text-muted-foreground">Client</div>
                      <div className="font-medium">{explanation.transaction.clientName}</div>
                    </div>
                  )}
                  {explanation.transaction.projectName && (
                    <div>
                      <div className="text-muted-foreground">Project</div>
                      <div className="font-medium">{explanation.transaction.projectName}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="calculation" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
                <TabsTrigger value="calculation" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Calculation</span>
                </TabsTrigger>
                <TabsTrigger value="adjustments" className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Adjustments</span>
                  {explanation.adjustments.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {explanation.adjustments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                {isAdmin && (
                  <>
                    <TabsTrigger value="rules" className="flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4" />
                      <span className="hidden sm:inline">Rules</span>
                    </TabsTrigger>
                    <TabsTrigger value="snapshot" className="flex items-center gap-1.5">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Snapshot</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Calculation Tab */}
              <TabsContent value="calculation" className="mt-4">
                {explanation.appliedRule ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Applied Rule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">{explanation.appliedRule.description}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Type: {explanation.appliedRule.ruleType}
                              {explanation.appliedRule.rate !== undefined &&
                                ` | Rate: ${explanation.appliedRule.rate}%`}
                              {explanation.appliedRule.flatAmount !== undefined &&
                                ` | Flat: ${formatCurrency(explanation.appliedRule.flatAmount)}`}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <CalculationBreakdown
                      basisType={explanation.appliedRule.calculation.basisType}
                      basisAmount={explanation.appliedRule.calculation.basisAmount}
                      rate={explanation.appliedRule.rate}
                      flatAmount={explanation.appliedRule.flatAmount}
                      rawAmount={explanation.appliedRule.calculation.rawAmount}
                      finalAmount={explanation.appliedRule.calculation.finalAmount}
                    />
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No detailed calculation breakdown available. This commission may have been
                      calculated with an older version of the system.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Adjustments Tab */}
              <TabsContent value="adjustments" className="mt-4">
                <AdjustmentsTimeline
                  adjustments={explanation.adjustments}
                  originalAmount={explanation.summary.commissionAmount}
                />
              </TabsContent>

              {/* Rules Tab (Admin Only) */}
              {isAdmin && (
                <TabsContent value="rules" className="mt-4">
                  {explanation.adminDetails?.fullRuleTrace &&
                  explanation.adminDetails.fullRuleTrace.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Rules are evaluated in priority order. The first eligible rule is selected.
                      </div>
                      <RuleTraceList ruleTrace={explanation.adminDetails.fullRuleTrace} />
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Rule trace not available. This commission was calculated before trace
                        tracking was implemented.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              )}

              {/* Snapshot Tab (Admin Only) */}
              {isAdmin && (
                <TabsContent value="snapshot" className="mt-4">
                  <div className="space-y-4">
                    {/* Version Info */}
                    {explanation.adminDetails && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Version Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Engine Version</div>
                              <div className="font-mono">
                                {explanation.adminDetails.engineVersion}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Plan Version</div>
                              <div className="font-medium">
                                {explanation.adminDetails.planVersion.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Updated: {formatDate(explanation.adminDetails.planVersion.updatedAt)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Input Snapshot */}
                    {explanation.adminDetails?.inputSnapshot ? (
                      <InputSnapshotCard snapshot={explanation.adminDetails.inputSnapshot} />
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Input snapshot not available for this commission.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
