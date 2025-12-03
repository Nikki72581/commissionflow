import { DashboardClient } from '@/components/dashboard/dashboard-client'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Dashboard | CommissionFlow',
  description: 'Sales and commission analytics dashboard',
}

export default function DashboardPage() {
  return <DashboardClient />
}
