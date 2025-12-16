// src/app/dashboard/layout.tsx
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar'
import { EnhancedHeader } from '@/components/navigation/enhanced-header'
import { MobileBottomNav } from '@/components/navigation/mobile-navigation'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  // Get user info with organization
  const user = await prisma.user.findUnique({
    where: { clerkId: userId! },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          planTier: true,
        },
      },
    },
  })

  // Get pending count for badges
  const pendingCount = await prisma.commissionCalculation.count({
    where: {
      status: 'PENDING',
      user: { clerkId: userId! },
    },
  })

  const userName = `${user?.firstName} ${user?.lastName}`
  const userEmail = user?.email || ''
  const userRole = user?.role || 'SALESPERSON'
  const organizationName = user?.organization?.name || 'Unknown Organization'
  const organizationSlug = user?.organization?.slug || ''

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