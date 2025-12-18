// src/app/dashboard/layout.tsx
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar'
import { EnhancedHeader } from '@/components/navigation/enhanced-header'
import { MobileBottomNav } from '@/components/navigation/mobile-navigation'
import { getCurrentUserWithOrg } from '@/lib/auth'

import { prisma } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use auth helper that ensures user has completed onboarding
  const user = await getCurrentUserWithOrg()

  // Get pending count for badges
  const pendingCount = await prisma.commissionCalculation.count({
    where: {
      status: 'PENDING',
      user: { clerkId: user.clerkId },
    },
  })

  const userName = `${user.firstName} ${user.lastName}`
  const userEmail = user.email
  const userRole = user.role
  const organizationName = user.organization.name
  const organizationSlug = user.organization.slug

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <EnhancedHeader
        userName={userName}
        userEmail={userEmail}
        userRole={userRole as 'ADMIN' | 'SALESPERSON'}
        organizationName={organizationName}
        organizationSlug={organizationSlug}
        notificationCount={pendingCount}
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r md:block">
          <EnhancedSidebar
            userRole={userRole as 'ADMIN' | 'SALESPERSON'}
            pendingCount={pendingCount}
            userName={userName}
            organizationName={organizationName}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        userRole={userRole as 'ADMIN' | 'SALESPERSON'}
        pendingCount={pendingCount}
      />
    </div>
  )
}