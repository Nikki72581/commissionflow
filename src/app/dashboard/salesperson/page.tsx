// app/dashboard/salesperson/page.tsx
import { getCurrentUserWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
export const dynamic = 'force-dynamic'
export default async function SalespersonDashboard() {
  const user = await getCurrentUserWithOrg();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Fetch salesperson metrics
  const [
    totalEarnings,
    thisMonthEarnings,
    pendingCommissions,
    approvedCommissions
  ] = await Promise.all([
    db.commissionCalculation.aggregate({
      where: { 
        userId: user.id,
        status: { in: ['APPROVED', 'PAID'] }
      },
      _sum: { amount: true }
    }),
    db.commissionCalculation.aggregate({
      where: { 
        userId: user.id,
        calculatedAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      _sum: { amount: true }
    }),
    db.commissionCalculation.count({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    }),
    db.commissionCalculation.count({
      where: {
        userId: user.id,
        status: 'APPROVED'
      }
    })
  ]);

  const metrics = [
    {
      title: 'Total Earnings',
      value: `$${(totalEarnings._sum.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'All-time commissions',
    },
    {
      title: 'This Month',
      value: `$${(thisMonthEarnings._sum.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Calendar,
      description: format(now, 'MMMM yyyy'),
    },
    {
      title: 'Pending Review',
      value: pendingCommissions.toString(),
      icon: TrendingUp,
      description: 'Awaiting approval',
    },
    {
      title: 'Approved',
      value: approvedCommissions.toString(),
      icon: CheckCircle,
      description: 'Ready for payout',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Track your commission earnings and performance</p>
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

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>Your latest commission calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No commissions yet. Your earnings will appear here once sales are processed.
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Trend</CardTitle>
          <CardDescription>Your commission performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart coming soon - track your earnings month by month
          </div>
        </CardContent>
      </Card>
    </div>
  );
}