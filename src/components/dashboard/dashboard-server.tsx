import { Suspense } from 'react'
import { getDashboardStats, getCommissionTrends, getTopPerformers } from '@/app/actions/dashboard'
import { getDateRangeFromPreset } from '@/lib/date-range'
import { DashboardContent } from './dashboard-content'
import { DashboardSkeleton } from './dashboard-skeleton'

async function DashboardData() {
  const defaultDateRange = getDateRangeFromPreset('thisMonth')
  // Fetch all data in parallel on the server
  const [statsResult, trendsResult, performersResult] = await Promise.all([
    getDashboardStats(defaultDateRange),
    getCommissionTrends({ dateRange: defaultDateRange }),
    getTopPerformers(defaultDateRange, 10),
  ])

  const stats = statsResult.success ? statsResult.data : null
  const trends = (trendsResult.success ? trendsResult.data : []) || []
  const performers = (performersResult.success ? performersResult.data : []) || []

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <DashboardContent
      initialStats={stats}
      initialTrends={trends}
      initialPerformers={performers}
      initialDateRange={defaultDateRange}
    />
  )
}

export function DashboardServer() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  )
}
