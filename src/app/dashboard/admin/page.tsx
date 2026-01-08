// app/dashboard/admin/page.tsx
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, TrendingUp, Clock, Plus, RefreshCw, FileQuestion } from 'lucide-react';
import Link from 'next/link';
export const dynamic = 'force-dynamic'
export default async function AdminDashboard() {
  const user = await requireAdmin();

  // Fetch dashboard metrics
  const [
    salespeople,
    totalCommissions,
    pendingPayouts,
    activePlans
  ] = await Promise.all([
    db.user.count({
      where: { 
        organizationId: user.organizationId,
        role: 'SALESPERSON'
      }
    }),
    db.commissionCalculation.aggregate({
      where: { 
        organizationId: user.organizationId,
        status: 'APPROVED'
      },
      _sum: { amount: true }
    }),
    db.payout.count({
      where: {
        organizationId: user.organizationId,
        status: 'PENDING'
      }
    }),
    db.commissionPlan.count({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    })
  ]);

  const metrics = [
    {
      title: 'Total Salespeople',
      value: salespeople.toString(),
      icon: Users,
      description: 'Active team members',
    },
    {
      title: 'Total Commissions',
      value: `$${(totalCommissions._sum.amount || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'Approved to date',
    },
    {
      title: 'Pending Payouts',
      value: pendingPayouts.toString(),
      icon: Clock,
      description: 'Awaiting processing',
    },
    {
      title: 'Active Plans',
      value: activePlans.toString(),
      icon: TrendingUp,
      description: 'Commission structures',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName}!</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Commission Plan
            </CardTitle>
            <CardDescription>
              Design a new commission structure with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/admin/plans/new">Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Team
            </CardTitle>
            <CardDescription>
              Add salespeople and assign commission plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/team">View Team</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Import Sales Data
            </CardTitle>
            <CardDescription>
              Upload sales transactions to calculate commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/import">Import Now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recalculate Commissions
            </CardTitle>
            <CardDescription>
              Update commission amounts based on current plan rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/recalculate-commissions">Recalculate</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Missing Commissions
            </CardTitle>
            <CardDescription>
              Find and calculate commissions for transactions without calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/missing-commissions">Scan Now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest commission calculations and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No recent activity. Start by creating a commission plan and importing sales data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
