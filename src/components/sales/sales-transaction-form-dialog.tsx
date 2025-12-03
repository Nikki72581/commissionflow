'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import { createSalesTransaction, updateSalesTransaction } from '@/app/actions/sales-transactions'

interface SalesTransaction {
  id: string
  amount: number
  transactionDate: Date
  description?: string | null
  projectId: string
  userId: string
}

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface SalesTransactionFormDialogProps {
  transaction?: SalesTransaction
  projects: Project[]
  users: User[]
  trigger?: React.ReactNode
}

export function SalesTransactionFormDialog({
  transaction,
  projects,
  users,
  trigger,
}: SalesTransactionFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState(transaction?.projectId || '')
  const [selectedUserId, setSelectedUserId] = useState(transaction?.userId || '')

  const isEdit = !!transaction

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      amount: parseFloat(formData.get('amount') as string),
      transactionDate: formData.get('transactionDate') as string,
      description: formData.get('description') as string,
      projectId: selectedProjectId,
      userId: selectedUserId,
    }

    // Validate required fields
    if (!data.projectId) {
      setError('Please select a project')
      setLoading(false)
      return
    }

    if (!data.userId) {
      setError('Please select a salesperson')
      setLoading(false)
      return
    }

    try {
      const result = isEdit
        ? await updateSalesTransaction(transaction.id, data)
        : await createSalesTransaction(data)

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

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the sale details.'
                : 'Enter sale details. Commission will be calculated automatically if a plan exists.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">
                Sale Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={transaction?.amount}
                  placeholder="10000.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transactionDate">
                Sale Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="transactionDate"
                name="transactionDate"
                type="date"
                defaultValue={
                  transaction ? formatDateForInput(transaction.transactionDate) : ''
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="projectId">
                Project <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.client.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="userId">
                Salesperson <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={transaction?.description || ''}
                placeholder="Add any notes about this sale..."
                rows={3}
              />
            </div>

            {!isEdit && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">💡 Automatic Commission Calculation</p>
                <p className="text-muted-foreground mt-1">
                  If the selected project has an active commission plan, we'll calculate the
                  commission automatically.
                </p>
              </div>
            )}
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
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Record Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
