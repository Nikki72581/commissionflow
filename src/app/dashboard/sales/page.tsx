import { Suspense } from 'react'
import Link from 'next/link'
import { DollarSign, Search } from 'lucide-react'
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
import { EmptyState } from '@/components/ui/empty-state'
import { getSalesTransactions } from '@/app/actions/sales-transactions'
import { getProjects } from '@/app/actions/projects'
import { getUsers } from '@/app/actions/users'
import { SalesTransactionFormDialog } from '@/components/sales/sales-transaction-form-dialog'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Sales | CommissionFlow',
  description: 'Manage your sales transactions',
}

async function SalesTable({ searchQuery }: { searchQuery?: string }) {
  const [salesResult, projectsResult, usersResult] = await Promise.all([
    getSalesTransactions(),
    getProjects(),
    getUsers(),
  ])

  if (!salesResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {salesResult.error}
      </div>
    )
  }

  if (!projectsResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {projectsResult.error}
      </div>
    )
  }

  let sales = salesResult.data || []
  const projects = projectsResult.data || []
  const users = usersResult.success ? usersResult.data || [] : []

  // Filter by search query
  if (searchQuery && sales.length > 0) {
    const query = searchQuery.toLowerCase()
    sales = sales.filter(
      (sale) =>
        sale.description?.toLowerCase().includes(query) ||
        sale.project.name.toLowerCase().includes(query) ||
        sale.project.client.name.toLowerCase().includes(query) ||
        `${sale.user.firstName} ${sale.user.lastName}`.toLowerCase().includes(query)
    )
  }

  if (sales.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          icon={Search}
          title="No sales found"
          description={`No sales match "${searchQuery}". Try a different search term.`}
        />
      )
    }

    return (
      <EmptyState
        icon={DollarSign}
        title="No sales yet"
        description="Record your first sale to start tracking commissions."
      />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Salesperson</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const hasCommission = sale.commissionCalculations.length > 0
            const commission = hasCommission ? sale.commissionCalculations[0] : null

            return (
              <TableRow key={sale.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(sale.transactionDate)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(sale.amount)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/projects/${sale.project.id}`}
                    className="hover:underline"
                  >
                    {sale.project.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.project.client.name}
                </TableCell>
                <TableCell>
                  {sale.user.firstName} {sale.user.lastName}
                </TableCell>
                <TableCell>
                  {commission ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrency(commission.amount)}
                      </span>
                      <Badge
                        variant={
                          commission.status === 'PAID'
                            ? 'default'
                            : commission.status === 'APPROVED'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {commission.status}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No plan</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {sale.description || '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SalesTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-8 text-center text-muted-foreground">
        Loading sales transactions...
      </div>
    </div>
  )
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const [projectsResult, usersResult] = await Promise.all([
    getProjects(),
    getUsers(),
  ])
  
const projects = projectsResult.success ? (projectsResult.data || []) : []
const users = (usersResult.success ? (usersResult.data || []) : [])
  .filter(user => user.firstName && user.lastName) as Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Transactions</h1>
          <p className="text-muted-foreground">
            Track all sales and their commission calculations
          </p>
        </div>
        <SalesTransactionFormDialog projects={projects} users={users} />
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1" action="/dashboard/sales" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search sales..."
              defaultValue={searchParams.search}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      <Suspense fallback={<SalesTableSkeleton />}>
        <SalesTable searchQuery={searchParams.search} />
      </Suspense>
    </div>
  )
}
