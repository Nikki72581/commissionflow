'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'
import {
  Search,
  Plus,
  Bell,
  Settings,
  ShoppingCart,
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  Building2,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface EnhancedHeaderProps {
  userName?: string
  userEmail?: string
  userRole?: 'ADMIN' | 'SALESPERSON'
  organizationName?: string
  organizationSlug?: string
  notificationCount?: number
  onSignOut?: () => void
}

export function EnhancedHeader({
  userName = 'John Doe',
  userRole = 'ADMIN',
  organizationName = 'My Organization',
  notificationCount = 0,
}: EnhancedHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const quickActions = [
    {
      title: 'New Sale',
      href: '/dashboard/sales/new',
      icon: ShoppingCart,
      shortcut: '⌘S',
      adminOnly: true,
    },
    {
      title: 'New Client',
      href: '/dashboard/clients/new',
      icon: Users,
      shortcut: '⌘C',
    },
    {
      title: 'New Project',
      href: '/dashboard/projects/new',
      icon: FolderKanban,
      shortcut: '⌘P',
    },
    {
      title: 'New Commission Plan',
      href: '/dashboard/plans/new',
      icon: FileText,
      shortcut: '⌘L',
      adminOnly: true,
    },
  ]

  const notifications = [
    // This would come from API
    {
      id: 1,
      title: 'Commission Approved',
      description: '$1,234.56 commission has been approved',
      time: '5m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'New Sale Created',
      description: 'ABC Corp - $50,000',
      time: '1h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Payment Processed',
      description: '15 commissions paid successfully',
      time: '2h ago',
      unread: false,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6" />
          <span className="hidden sm:inline-block">CommissionFlow</span>
        </Link>

        {/* Organization Info - Always visible, responsive layout */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium leading-none truncate">{organizationName}</span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:block">{userName}</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sales, clients, commissions... (Press / to focus)"
              className={cn(
                'w-full pl-9 pr-4',
                searchFocused && 'ring-2 ring-primary'
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {!searchFocused && (
              <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">/</span>
              </kbd>
            )}
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Create Dropdown */}
          {userRole === 'ADMIN' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Create</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickActions
                  .filter((action) => !action.adminOnly || userRole === 'ADMIN')
                  .map((action) => {
                    const Icon = action.icon
                    return (
                      <DropdownMenuItem key={action.title} asChild>
                        <Link href={action.href}>
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{action.title}</span>
                          {action.shortcut && (
                            <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-3"
                    >
                      <div className="flex w-full items-start gap-2">
                        {notification.unread && (
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/notifications" className="w-full text-center">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Organization Switcher - Allows switching between orgs */}
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'flex items-center',
                organizationSwitcherTrigger: 'px-3 py-2 rounded-lg border hover:bg-accent',
              },
            }}
          />

          {/* User Button with account management */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label="Dashboard"
                labelIcon={<LayoutDashboard className="h-4 w-4" />}
                href="/dashboard"
              />
              {userRole === 'SALESPERSON' && (
                <UserButton.Link
                  label="My Commissions"
                  labelIcon={<DollarSign className="h-4 w-4" />}
                  href="/dashboard/my-commissions"
                />
              )}
              <UserButton.Link
                label="Settings"
                labelIcon={<Settings className="h-4 w-4" />}
                href="/dashboard/settings"
              />
              <UserButton.Action label="manageAccount" />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  )
}
