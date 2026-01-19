'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Menu,
  Users,
  FolderKanban,
  CheckCircle,
  CreditCard,
  FileText,
  User,
  Settings,
  Shield,
  HelpCircle,
  ChevronRight,
  Receipt,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'

interface MobileNavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface MobileMenuSection {
  title: string
  icon: React.ElementType
  items: MobileMenuItem[]
  adminOnly?: boolean
  salesPersonOnly?: boolean
}

interface MobileMenuItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
  adminOnly?: boolean
  salesPersonOnly?: boolean
}

interface MobileBottomNavProps {
  userRole?: 'ADMIN' | 'SALESPERSON'
  pendingCount?: number
}

// Mobile-optimized menu structure
const mobileMenuSections: MobileMenuSection[] = [
  {
    title: 'Sales',
    icon: ShoppingCart,
    items: [
      { title: 'All Sales', href: '/dashboard/sales', icon: ShoppingCart },
      { title: 'Clients', href: '/dashboard/clients', icon: Users },
      { title: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    ],
  },
  {
    title: 'Commissions',
    icon: DollarSign,
    items: [
      { title: 'All Commissions', href: '/dashboard/commissions', icon: DollarSign },
      { title: 'Pending Approvals', href: '/dashboard/commissions/pending', icon: CheckCircle, adminOnly: true },
      { title: 'Bulk Payouts', href: '/dashboard/commissions/payouts', icon: CreditCard, adminOnly: true },
      { title: 'Payout History', href: '/dashboard/commissions/payout-history', icon: Receipt, adminOnly: true },
      { title: 'Commission Plans', href: '/dashboard/plans', icon: FileText },
    ],
  },
  {
    title: 'My Commissions',
    icon: User,
    salesPersonOnly: true,
    items: [
      { title: 'View My Commissions', href: '/dashboard/my-commissions', icon: User },
    ],
  },
  {
    title: 'Administration',
    icon: Shield,
    adminOnly: true,
    items: [
      { title: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { title: 'Team Members', href: '/dashboard/team', icon: Users },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

export function MobileBottomNav({
  userRole = 'ADMIN',
  pendingCount = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems: MobileNavItem[] = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Sales',
      href: '/dashboard/sales',
      icon: ShoppingCart,
    },
    {
      title: 'Commissions',
      href: '/dashboard/commissions',
      icon: DollarSign,
      badge: pendingCount,
    },
    {
      title: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const isItemVisible = (item: { adminOnly?: boolean; salesPersonOnly?: boolean }) => {
    if (item.adminOnly && userRole !== 'ADMIN') return false
    if (item.salesPersonOnly && userRole !== 'SALESPERSON') return false
    return true
  }

  const handleNavClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden safe-area-bottom">
        <div className="grid h-16 grid-cols-5 items-center px-1">
          {/* Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-14 active:bg-accent/50 rounded-lg',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2.5 -top-1.5 h-4 min-w-4 px-1 py-0 text-[10px] flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.title}</span>
              </Link>
            )
          })}

          {/* More Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors min-h-14 active:bg-accent/50 rounded-lg">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">More</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-[320px] p-0">
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="border-b px-4 py-4">
                  <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navigation menu</SheetDescription>
                </div>

                {/* Scrollable Menu Content */}
                <div className="flex-1 overflow-y-auto py-2">
                  {mobileMenuSections.map((section) => {
                    if (!isItemVisible(section)) return null
                    const visibleItems = section.items.filter(isItemVisible)
                    if (visibleItems.length === 0) return null

                    return (
                      <div key={section.title} className="mb-2">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 px-4 py-2">
                          <section.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {section.title}
                          </span>
                        </div>

                        {/* Section Items */}
                        <div className="space-y-0.5 px-2">
                          {visibleItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleNavClick}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors active:bg-accent',
                                  active
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'text-foreground hover:bg-accent/50'
                                )}
                              >
                                <item.icon className="h-5 w-5 shrink-0" />
                                <span className="flex-1">{item.title}</span>
                                {item.badge && item.badge > 0 && (
                                  <Badge variant="destructive" className="ml-auto">
                                    {item.badge}
                                  </Badge>
                                )}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Quick Links */}
                  <div className="border-t mt-2 pt-2">
                    <div className="px-2">
                      <Link
                        href="/dashboard/help"
                        onClick={handleNavClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors active:bg-accent hover:bg-accent/50"
                      >
                        <HelpCircle className="h-5 w-5" />
                        <span>Help & Support</span>
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Pending Approvals Alert */}
                {userRole === 'ADMIN' && pendingCount > 0 && (
                  <div className="border-t p-4 bg-amber-500/10">
                    <Link
                      href="/dashboard/commissions/pending"
                      onClick={handleNavClick}
                      className="flex items-center justify-between rounded-lg bg-amber-500/20 px-4 py-3 transition-colors active:bg-amber-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Pending Approvals
                        </span>
                      </div>
                      <Badge variant="warning">{pendingCount}</Badge>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer for fixed bottom nav - accounts for safe area */}
      <div className="h-16 md:hidden" />
    </>
  )
}

/**
 * Mobile Header with Hamburger Menu
 * Alternative to bottom nav if you prefer top menu
 */
interface MobileHeaderProps {
  userRole?: 'ADMIN' | 'SALESPERSON'
  pendingCount?: number
}

export function MobileHeader({
  userRole = 'ADMIN',
  pendingCount = 0,
}: MobileHeaderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const isItemVisible = (item: { adminOnly?: boolean; salesPersonOnly?: boolean }) => {
    if (item.adminOnly && userRole !== 'ADMIN') return false
    if (item.salesPersonOnly && userRole !== 'SALESPERSON') return false
    return true
  }

  const handleNavClick = () => {
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 p-2 -ml-2 rounded-lg active:bg-accent">
              <Menu className="h-5 w-5" />
              <span className="font-semibold">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0">
            <div className="flex h-full flex-col">
              <div className="border-b px-4 py-4">
                <SheetTitle className="text-lg font-semibold">CommissionFlow</SheetTitle>
                <SheetDescription className="sr-only">Navigation menu</SheetDescription>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {mobileMenuSections.map((section) => {
                  if (!isItemVisible(section)) return null
                  const visibleItems = section.items.filter(isItemVisible)
                  if (visibleItems.length === 0) return null

                  return (
                    <div key={section.title} className="mb-2">
                      <div className="flex items-center gap-2 px-4 py-2">
                        <section.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {section.title}
                        </span>
                      </div>
                      <div className="space-y-0.5 px-2">
                        {visibleItems.map((item) => {
                          const active = isActive(item.href)
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleNavClick}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors active:bg-accent',
                                active
                                  ? 'bg-accent text-accent-foreground font-medium'
                                  : 'text-foreground hover:bg-accent/50'
                              )}
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                              <span className="flex-1">{item.title}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/dashboard" className="font-bold">
          CommissionFlow
        </Link>

        {/* Notifications Badge */}
        {pendingCount > 0 && (
          <Link href="/dashboard/commissions/pending" className="relative">
            <Badge variant="destructive" className="h-6 min-w-6 rounded-full px-1.5 text-xs flex items-center justify-center">
              {pendingCount > 99 ? '99+' : pendingCount}
            </Badge>
          </Link>
        )}
        {pendingCount === 0 && <div className="w-6" />}
      </div>
    </header>
  )
}
