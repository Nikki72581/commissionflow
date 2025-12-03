import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { getCommissionCalculations } from '@/app/actions/commission-calculations'
import { CommissionActions } from '@/components/commissions/commission-actions'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Commissions | CommissionFlow',
  description: 'Review and approve commission calculations',
}

async function CommissionsTable({
  searchQuery,
  statusFilter,
}: {
  searchQuery?: string
  statusFilter?: string
}) {
  const result = await getCommissionCalculations()

  if (!result.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {result.error}
      </div>
    )
  }

  let calculations = result.data || []

  // Filter by status
  if (statusFilter && statusFilter !== 'all') {
    calculations = calculations.filter(
      (calc) => calc.status.toLowerCase() === statusFilter.toLowerCase()
    )
  }

  // Filter by search query
  if (searchQuery && calculations.length > 0) {
    const query = searchQuery.toLowerCase()
    calculations = calculations.filter(
      (calc) =>
        `${calc.user.firstName} ${calc.user.lastName}`.toLowerCase().includes(query) ||
        calc.salesTransaction.project.name.toLowerCase().includes(query) ||
        calc.salesTransaction.project.client.name.toLowerCase().includes(query) ||
        calc.commissionPlan.name.toLowerCase().includes(query)
    )
  }

  if (calculations.length === 0) {
    if (searchQuery || statusFilter !== 'all') {
      return (
        <EmptyState
          icon={Search}
          title="No commissions found"
          description="No commissions match your filters. Try adjusting your search."
        />
      )
    }

    return (
      <EmptyState
        icon={TrendingUp}
        title="No commissions yet"
        description="Commission calculations will appear here once you record sales."
      />
    )
  }

  // Calculate totals by status
  const totalAmount = calculations.reduce((sum, calc) => sum + calc.amount, 0)
  const pendingAmount = calculations
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, calc) => sum + calc.amount, 0)
  const approvedAmount = calculations
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, calc) => sum + calc.amount, 0)
  const paidAmount = calculations
    .filter((c) => c.status === 'PAID')
    .reduce((sum, calc) => sum + calc.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
          <Badge variant="outline" className="mt-1">
            {calculations.filter((c) => c.status === 'PENDING').length} items
          </Badge>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold">{formatCurrency(approvedAmount)}</div>
          <Badge variant="secondary" className="mt-1">
            {calculations.filter((c) => c.status === 'APPROVED').length} items
          </Badge>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Paid</div>
          <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
          <Badge variant="default" className="mt-1">
            {calculations.filter((c) => c.status === 'PAID').length} items
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Salesperson</TableHead>
              <TableHead>Sale Amount</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculations.map((calc) => (
              <TableRow key={calc.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(calc.calculatedAt)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {calc.user.firstName} {calc.user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{calc.user.email}</div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(calc.salesTransaction.amount)}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-lg">
                    {formatCurrency(calc.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((calc.amount / calc.salesTransaction.amount) * 100).toFixed(1)}% of
                    sale
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/plans/${calc.commissionPlan.id}`}
                    className="text-sm hover:underline"
                  >
                    {calc.commissionPlan.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/projects/${calc.salesTransaction.project.id}`}
                    className="text-sm hover:underline"
                  >
                    {calc.salesTransaction.project.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {calc.salesTransaction.project.client.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      calc.status === 'PAID'
                        ? 'default'
                        : calc.status === 'APPROVED'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {calc.status}
                  </Badge>
                  {calc.status === 'PAID' && calc.paidAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(calc.paidAt)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <CommissionActions
                    calculationId={calc.id}
                    status={calc.status}
                    amount={calc.amount}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function CommissionsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          Loading commissions...
        </div>
      </div>
    </div>
  )
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const statusFilter = searchParams.status || 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commissions</h1>
          <p className="text-muted-foreground">
            Review and approve commission calculations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1" action="/dashboard/commissions" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search commissions..."
              defaultValue={searchParams.search}
              className="pl-9"
            />
          </div>
          <input type="hidden" name="status" value={statusFilter} />
        </form>

        <Select value={statusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <a href="/dashboard/commissions?status=all">All Statuses</a>
            </SelectItem>
            <SelectItem value="pending">
              <a href="/dashboard/commissions?status=pending">Pending</a>
            </SelectItem>
            <SelectItem value="approved">
              <a href="/dashboard/commissions?status=approved">Approved</a>
            </SelectItem>
            <SelectItem value="paid">
              <a href="/dashboard/commissions?status=paid">Paid</a>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Suspense fallback={<CommissionsTableSkeleton />}>
        <CommissionsTable
          searchQuery={searchParams.search}
          statusFilter={statusFilter}
        />
      </Suspense>
    </div>
  )
}
