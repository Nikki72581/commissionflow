'use client'
import { useClerk } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Bell,
  User,
  Settings,
  LogOut,
  ShoppingCart,
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  Command,
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
  notificationCount?: number
  //Remove: onSignOut?: () => void
}

export function EnhancedHeader({
  userName,
  userEmail,
  userRole,
  notificationCount = 0,
  // Remove: onSignOut
}: EnhancedHeaderProps) {
  const { signOut } = useClerk()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline-block font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CommissionFlow</span>
        </Link>

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
        <div className="flex items-center gap-2">
          {/* Quick Create Dropdown */}
          {userRole === 'ADMIN' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  <Badge variant="outline" className="w-fit">
                    {userRole}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userRole === 'SALESPERSON' && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/my-commissions">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>My Commissions</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/keyboard-shortcuts">
                  <Command className="mr-2 h-4 w-4" />
                  <span>Keyboard Shortcuts</span>
                  <DropdownMenuShortcut>?</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
