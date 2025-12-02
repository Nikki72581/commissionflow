// app/dashboard/layout.tsx
import { UserButton } from '@clerk/nextjs';
import { getCurrentUserWithOrg } from '@/lib/auth';
import Link from 'next/link';
import { DollarSign, LayoutDashboard, Users, Settings, FileText, Upload } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserWithOrg();
  const isAdmin = user.role === 'ADMIN';

  const navigation = isAdmin
    ? [
        { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'Commission Plans', href: '/dashboard/admin/plans', icon: FileText },
        { name: 'Team', href: '/dashboard/admin/team', icon: Users },
        { name: 'Import Data', href: '/dashboard/admin/import', icon: Upload },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard/salesperson', icon: LayoutDashboard },
        { name: 'My Commissions', href: '/dashboard/salesperson/commissions', icon: DollarSign },
        { name: 'Settings', href: '/dashboard/salesperson/settings', icon: Settings },
      ];

  return (
    <div className="flex h-screen bg-muted/50">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CommissionFlow</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.organization.name}</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}