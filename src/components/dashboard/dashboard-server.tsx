import { Suspense } from 'react'
import { getDashboardStats, getCommissionTrends, getTopPerformers } from '@/app/actions/dashboard'
import { DashboardContent } from './dashboard-content'
import { DashboardSkeleton } from './dashboard-skeleton'

async function DashboardData() {
  // Fetch all data in parallel on the server
  const [statsResult, trendsResult, performersResult] = await Promise.all([
    getDashboardStats(undefined),
    getCommissionTrends(12),
    getTopPerformers(undefined, 10),
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
