import { Suspense } from 'react'
import Link from 'next/link'
import { getUsers } from '@/app/actions/users'
import { getTopPerformers } from '@/app/actions/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Performance Reports | CommissionFlow',
  description: 'Detailed salesperson performance metrics',
}

async function PerformanceTable() {
  const [usersResult, performersResult] = await Promise.all([
    getUsers(),
    getTopPerformers(undefined, 50), // Get top 50
  ])

  if (!usersResult.success || !performersResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        Failed to load performance data
      </div>
    )
  }

  const performers = performersResult.data || []

  if (performers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Performance Data</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Performance metrics will appear here once commissions are calculated.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salesperson Performance</CardTitle>
        <CardDescription>
          Detailed metrics for all salespeople
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Salesperson</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Total Commissions</TableHead>
              <TableHead className="text-right">Number of Sales</TableHead>
              <TableHead className="text-right">Avg Commission %</TableHead>
              <TableHead className="text-right">Avg Sale Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performers.map((performer, index) => {
              const averageSaleAmount = performer.totalSales / performer.salesCount

              return (
                <TableRow key={performer.userId}>
                  <TableCell>
                    <Badge variant={index < 3 ? 'default' : 'outline'}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{performer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {performer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(performer.totalSales)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(performer.totalCommissions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {performer.salesCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {performer.averageCommissionRate.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(averageSaleAmount)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PerformanceTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground">
            Detailed performance metrics and rankings
          </p>
        </div>
      </div>

      <Suspense fallback={<PerformanceTableSkeleton />}>
        <PerformanceTable />
      </Suspense>
    </div>
  )
}
