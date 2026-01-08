import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { getDashboardStats, getCommissionTrends, getTopPerformers } from '@/app/actions/dashboard'
import { getDateRangeFromPreset, DateRange } from '@/lib/date-range'
import { DashboardStats } from './dashboard-stats'
import { DashboardCharts } from './dashboard-charts'
import { DashboardSkeleton, StatsSkeleton, ChartsSkeleton } from './dashboard-skeleton'
import { DashboardHeader } from './dashboard-header'

// Cache dashboard stats for 5 minutes
const getCachedStats = unstable_cache(
  async (dateRange: DateRange) => getDashboardStats(dateRange),
  ['dashboard-stats'],
  { revalidate: 300 }
)

// Cache trends for 5 minutes
const getCachedTrends = unstable_cache(
  async (dateRange: DateRange) => getCommissionTrends({ dateRange }),
  ['dashboard-trends'],
  { revalidate: 300 }
)

// Cache top performers for 5 minutes
const getCachedPerformers = unstable_cache(
  async (dateRange: DateRange) => getTopPerformers(dateRange, 10),
  ['dashboard-performers'],
  { revalidate: 300 }
)

async function DashboardStatsSection() {
  const defaultDateRange = getDateRangeFromPreset('thisMonth')
  const statsResult = await getCachedStats(defaultDateRange)

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard statistics</p>
      </div>
    )
  }

  return <DashboardStats stats={statsResult.data} />
}

async function DashboardChartsSection() {
  const defaultDateRange = getDateRangeFromPreset('thisMonth')

  const [trendsResult, performersResult] = await Promise.all([
    getCachedTrends(defaultDateRange),
    getCachedPerformers(defaultDateRange),
  ])

  const trends = (trendsResult.success ? trendsResult.data : []) || []
  const performers = (performersResult.success ? performersResult.data : []) || []

  return <DashboardCharts trends={trends} performers={performers} />
}

export function DashboardServer() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Load stats first - critical for FCP */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsSection />
      </Suspense>

      {/* Load charts separately - improves LCP */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardChartsSection />
      </Suspense>
    </div>
  )
}
