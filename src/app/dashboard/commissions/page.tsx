import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { getCommissionCalculations } from '@/app/actions/commission-calculations'
import { CommissionDetailDialog } from '@/components/commissions/commission-detail-dialog'
import { CommissionFilters } from '@/components/commissions/commission-filters'
import { formatDate, formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Commissions | CommissionFlow',
  description: 'Review and approve commission calculations',
}

async function CommissionsTable({
  searchQuery,
  statusFilter,
  userIdFilter,
}: {
  searchQuery?: string
  statusFilter?: string
  userIdFilter?: string
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

  // Filter by userId (salesperson)
  if (userIdFilter && userIdFilter !== 'all') {
    calculations = calculations.filter(
      (calc) => calc.user.id === userIdFilter
    )
  }

  // Filter by search query
  if (searchQuery && calculations.length > 0) {
    const query = searchQuery.toLowerCase()
    calculations = calculations.filter(
      (calc) => {
        const salespersonName = `${calc.user.firstName} ${calc.user.lastName}`.toLowerCase()
        const projectName = calc.salesTransaction.project?.name?.toLowerCase() || ''
        const projectClientName = calc.salesTransaction.project?.client?.name?.toLowerCase() || ''
        const directClientName = calc.salesTransaction.client?.name?.toLowerCase() || ''
        const planName = calc.commissionPlan.name.toLowerCase()

        return (
          salespersonName.includes(query) ||
          projectName.includes(query) ||
          projectClientName.includes(query) ||
          directClientName.includes(query) ||
          planName.includes(query)
        )
      }
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
        <div className="rounded-lg border-2 hover:border-blue-500/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-muted/20 p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="rounded-lg border-2 hover:border-amber-500/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-amber-500/5 p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
          <Badge variant="outline" className="mt-1">
            {calculations.filter((c) => c.status === 'PENDING').length} items
          </Badge>
        </div>
        <div className="rounded-lg border-2 hover:border-green-500/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-green-500/5 p-4">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold">{formatCurrency(approvedAmount)}</div>
          <Badge variant="secondary" className="mt-1">
            {calculations.filter((c) => c.status === 'APPROVED').length} items
          </Badge>
        </div>
        <div className="rounded-lg border-2 hover:border-blue-500/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-blue-500/5 p-4">
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
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
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
                  <div className="space-y-1">
                    <div className="font-semibold text-lg">
                      {formatCurrency(calc.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((calc.amount / calc.salesTransaction.amount) * 100).toFixed(1)}% of sale
                    </div>
                    <CommissionDetailDialog
                      calculation={calc}
                      trigger={
                        <button className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-7 px-3 text-blue-600 dark:text-blue-400">
                          View Breakdown
                        </button>
                      }
                    />
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
                  {calc.salesTransaction.project ? (
                    <>
                      <Link
                        href={`/dashboard/projects/${calc.salesTransaction.project.id}`}
                        className="text-sm hover:underline"
                      >
                        {calc.salesTransaction.project.name}
                      </Link>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No Project</div>
                  )}
                </TableCell>
                <TableCell>
                  {calc.salesTransaction.client?.name ? (
                    <div className="text-sm">{calc.salesTransaction.client.name}</div>
                  ) : calc.salesTransaction.project?.client?.name ? (
                    <div className="text-sm">{calc.salesTransaction.project.client.name}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No Customer</div>
                  )}
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
{calc.status === 'PAID' && (calc as any).paidAt && (
  <div className="text-xs text-muted-foreground mt-1">
    {formatDate((calc as any).paidAt)}
  </div>
)}
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

export default async function CommissionsPage(props: {
  searchParams: Promise<{ search?: string; status?: string; userId?: string }>
}) {
  const searchParams = await props.searchParams
  const statusFilter = searchParams.status || 'all'
  const userIdFilter = searchParams.userId || 'all'

  // Fetch users for the salesperson filter
  const { prisma } = await import('@/lib/db')
  const { getCurrentUserWithOrg } = await import('@/lib/auth')
  const currentUser = await getCurrentUserWithOrg()

  const usersRaw = await prisma.user.findMany({
    where: {
      organizationId: currentUser.organizationId,
      isPlaceholder: false,
      firstName: { not: null },
      lastName: { not: null },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
  })

  const users = usersRaw.map((u) => ({
    id: u.id,
    firstName: u.firstName!,
    lastName: u.lastName!,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Commissions</h1>
          <p className="text-muted-foreground">
            Review and approve commission calculations
          </p>
        </div>
      </div>

      <CommissionFilters users={users} />

      <Suspense fallback={<CommissionsTableSkeleton />}>
        <CommissionsTable
          searchQuery={searchParams.search}
          statusFilter={statusFilter}
          userIdFilter={userIdFilter}
        />
      </Suspense>
    </div>
  )
}
