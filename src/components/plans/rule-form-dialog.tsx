'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { createCommissionRule, updateCommissionRule } from '@/app/actions/commission-plans'

interface CommissionRule {
  id: string
  ruleType: 'PERCENTAGE' | 'FLAT_AMOUNT' | 'TIERED'
  percentage?: number | null
  flatAmount?: number | null
  tierThreshold?: number | null
  tierPercentage?: number | null
  minAmount?: number | null
  maxAmount?: number | null
  description?: string | null
}

interface RuleFormDialogProps {
  planId: string
  rule?: CommissionRule
  trigger?: React.ReactNode
}

export function RuleFormDialog({ planId, rule, trigger }: RuleFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ruleType, setRuleType] = useState<string>(rule?.ruleType || 'PERCENTAGE')

  const isEdit = !!rule

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    const data: any = {
      commissionPlanId: planId,
      ruleType,
      description: formData.get('description') as string,
      minAmount: formData.get('minAmount') ? parseFloat(formData.get('minAmount') as string) : undefined,
      maxAmount: formData.get('maxAmount') ? parseFloat(formData.get('maxAmount') as string) : undefined,
    }

    // Add type-specific fields
    if (ruleType === 'PERCENTAGE') {
      data.percentage = parseFloat(formData.get('percentage') as string)
    } else if (ruleType === 'FLAT_AMOUNT') {
      data.flatAmount = parseFloat(formData.get('flatAmount') as string)
    } else if (ruleType === 'TIERED') {
      data.percentage = parseFloat(formData.get('basePercentage') as string)
      data.tierThreshold = parseFloat(formData.get('tierThreshold') as string)
      data.tierPercentage = parseFloat(formData.get('tierPercentage') as string)
    }

    try {
      const result = isEdit
        ? await updateCommissionRule(rule.id, data)
        : await createCommissionRule(data)

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Rule' : 'Add Commission Rule'}</DialogTitle>
            <DialogDescription>
              Define how commissions are calculated for this plan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="ruleType">
                Rule Type <span className="text-destructive">*</span>
              </Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage of Sale</SelectItem>
                  <SelectItem value="FLAT_AMOUNT">Flat Amount</SelectItem>
                  <SelectItem value="TIERED">Tiered (Different rates)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PERCENTAGE type fields */}
            {ruleType === 'PERCENTAGE' && (
              <div className="grid gap-2">
                <Label htmlFor="percentage">
                  Percentage <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="percentage"
                    name="percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={rule?.percentage || ''}
                    placeholder="10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  E.g., 10% means $1,000 commission on $10,000 sale
                </p>
              </div>
            )}

            {/* FLAT_AMOUNT type fields */}
            {ruleType === 'FLAT_AMOUNT' && (
              <div className="grid gap-2">
                <Label htmlFor="flatAmount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="flatAmount"
                    name="flatAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={rule?.flatAmount || ''}
                    placeholder="500"
                    className="pl-7"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed amount paid per sale, regardless of sale size
                </p>
              </div>
            )}

            {/* TIERED type fields */}
            {ruleType === 'TIERED' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="basePercentage">
                      Base Rate <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="basePercentage"
                        name="basePercentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        defaultValue={rule?.percentage || ''}
                        placeholder="5"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tierThreshold">
                      Threshold <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="tierThreshold"
                        name="tierThreshold"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={rule?.tierThreshold || ''}
                        placeholder="10000"
                        className="pl-7"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tierPercentage">
                    Rate Above Threshold <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="tierPercentage"
                      name="tierPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={rule?.tierPercentage || ''}
                      placeholder="7"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Example: 5% up to $10,000, then 7% on amounts above
                </p>
              </>
            )}

            {/* Optional caps */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Optional Caps</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minAmount">Minimum</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="minAmount"
                      name="minAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={rule?.minAmount || ''}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxAmount">Maximum</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="maxAmount"
                      name="maxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={rule?.maxAmount || ''}
                      placeholder="No limit"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Notes (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={rule?.description || ''}
                placeholder="Add any notes about this rule..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
