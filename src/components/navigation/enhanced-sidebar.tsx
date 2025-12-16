'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FolderKanban,
  DollarSign,
  CheckCircle,
  CreditCard,
  FileText,
  BarChart3,
  User,
  Settings,
  Shield,
  FileSearch,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: 'default' | 'destructive' | 'secondary'
  children?: NavItem[]
  adminOnly?: boolean
  salesPersonOnly?: boolean
}

// Navigation structure
const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Sales Management',
    icon: ShoppingCart,
    children: [
      {
        title: 'Sales',
        href: '/dashboard/sales',
        icon: ShoppingCart,
      },
      {
        title: 'Clients',
        href: '/dashboard/clients',
        icon: Users,
      },
      {
        title: 'Projects',
        href: '/dashboard/projects',
        icon: FolderKanban,
      },
    ],
  },
  {
    title: 'Commissions',
    icon: DollarSign,
    children: [
      {
        title: 'All Commissions',
        href: '/dashboard/commissions',
        icon: DollarSign,
      },
      {
        title: 'Pending Approvals',
        href: '/dashboard/commissions?status=PENDING',
        icon: CheckCircle,
        badge: 'pendingCount', // Will be replaced with actual count
        badgeVariant: 'destructive',
        adminOnly: true,
      },
      {
        title: 'Bulk Payouts',
        href: '/dashboard/commissions/payouts',
        icon: CreditCard,
        adminOnly: true,
      },
      {
        title: 'Commission Plans',
        href: '/dashboard/plans',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'My Commissions',
    href: '/dashboard/my-commissions',
    icon: User,
    salesPersonOnly: true,
  },
  {
    title: 'Administration',
    icon: Shield,
    adminOnly: true,
    children: [
      {
        title: 'Team Members',
        href: '/dashboard/team',
        icon: Users,
        adminOnly: true,
      },
      {
        title: 'Audit Logs',
        href: '/dashboard/audit-logs',
        icon: FileSearch,
        adminOnly: true,
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Help & Support',
    icon: HelpCircle,
    children: [
      {
        title: 'Documentation',
        href: '/docs',
        icon: FileText,
      },
      {
        title: 'Keyboard Shortcuts',
        href: '/keyboard-shortcuts',
        icon: HelpCircle,
      },
    ],
  },
]

interface EnhancedSidebarProps {
  userRole?: 'ADMIN' | 'SALESPERSON'
  pendingCount?: number
  unpaidCount?: number
  userName?: string
  organizationName?: string
}

export function EnhancedSidebar({
  userRole = 'ADMIN',
  pendingCount = 0,
  unpaidCount = 0,
  userName,
  organizationName,
}: EnhancedSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'Sales Management',
    'Commissions',
    'Administration',
  ])

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    )
  }

  const isItemVisible = (item: NavItem) => {
    if (item.adminOnly && userRole !== 'ADMIN') return false
    if (item.salesPersonOnly && userRole !== 'SALESPERSON') return false
    return true
  }

  const getBadgeValue = (badge?: string | number) => {
    if (typeof badge === 'number') return badge
    if (badge === 'pendingCount') return pendingCount
    if (badge === 'unpaidCount') return unpaidCount
    return badge
  }

  const isActive = (href?: string) => {
    if (!href) return false
    // Exact match for dashboard
    if (href === '/dashboard' && pathname === '/dashboard') return true
    // Starts with match for other pages
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    if (!isItemVisible(item)) return null

    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections.includes(item.title)
    const active = isActive(item.href)
    const badgeValue = getBadgeValue(item.badge)

    // Section with children
    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleSection(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
              level > 0 && 'pl-9'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left font-medium">{item.title}</span>
            {badgeValue && (
              <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                {badgeValue}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    // Regular link item
    return (
      <Link
        key={item.title}
        href={item.href!}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
          active && 'bg-accent font-medium text-accent-foreground',
          level > 0 && 'pl-9'
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{item.title}</span>
        {badgeValue && (
          <Badge variant={item.badgeVariant || 'default'}>
            {badgeValue}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Organization & User Info Header */}
      {(organizationName || userName) && (
        <div className="border-b border-border p-4">
          <div className="space-y-1">
            {organizationName && (
              <p className="text-sm font-semibold truncate">{organizationName}</p>
            )}
            {userName && (
              <p className="text-xs text-muted-foreground truncate">{userName}</p>
            )}
            <Badge variant="outline" className="w-fit text-xs">
              {userRole}
            </Badge>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => renderNavItem(item))}
        </nav>
      </div>

      {/* Quick Stats */}
      {userRole === 'ADMIN' && (pendingCount > 0 || unpaidCount > 0) && (
        <div className="border-t border-border p-4">
          <div className="space-y-2 text-sm">
            {pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Approval</span>
                <Badge variant="destructive">{pendingCount}</Badge>
              </div>
            )}
            {unpaidCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unpaid</span>
                <Badge variant="secondary">{unpaidCount}</Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
