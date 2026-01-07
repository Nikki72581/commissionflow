import { Suspense } from 'react'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { getCommissionPlans } from '@/app/actions/commission-plans'
import { getProjects } from '@/app/actions/projects'
import { CommissionPlanFormDialog } from '@/components/plans/plan-form-dialog'
import { PlanActions } from '@/components/plans/plan-actions'
import { formatDate } from '@/lib/utils'
import { getRuleTypeLabel } from '@/lib/commission-calculator'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Commission Plans | CommissionFlow',
  description: 'Manage your commission plans',
}

async function PlansTable({ searchQuery }: { searchQuery?: string }) {
  const plansResult = await getCommissionPlans()

  if (!plansResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {plansResult.error}
      </div>
    )
  }

  let plans = plansResult.data || []

  // Filter by search query
  if (searchQuery && plans.length > 0) {
    const query = searchQuery.toLowerCase()
    plans = plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query) ||
        plan.project?.name.toLowerCase().includes(query)
    )
  }

  if (plans.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          icon={Search}
          title="No plans found"
          description={`No plans match "${searchQuery}". Try a different search term.`}
          data-testid="empty-state"
        />
      )
    }

    return (
      <EmptyState
        icon={FileText}
        title="No commission plans yet"
        description="Create your first commission plan to define how commissions are calculated."
        data-testid="empty-state"
      />
    )
  }

  // Helper function to get badge variant for rule type
  const getRuleBadgeVariant = (ruleType: string) => {
    switch (ruleType) {
      case 'FLAT_RATE':
        return 'info'
      case 'PERCENTAGE':
        return 'success'
      case 'TIERED':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
            <TableHead className="font-semibold">Plan Name</TableHead>
            <TableHead className="font-semibold">Project</TableHead>
            <TableHead className="font-semibold">Rules</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Calculations</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow
              key={plan.id}
              className={`transition-colors border-b border-emerald-500/5 ${
                plan.isActive ? 'hover:bg-emerald-500/5' : 'hover:bg-slate-500/5 opacity-70'
              }`}
              data-testid="plan-row"
            >
              <TableCell>
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className={`font-medium hover:underline transition-colors ${
                    plan.isActive
                      ? 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  data-testid="plan-name"
                >
                  {plan.name}
                </Link>
                {plan.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs mt-0.5">
                    {plan.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                {plan.project ? (
                  <Link
                    href={`/dashboard/projects/${plan.project.id}`}
                    className="text-sm text-blue-700 dark:text-blue-400 hover:underline hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                  >
                    {plan.project.name}
                  </Link>
                ) : (
                  <Badge variant="outline" className="border-slate-500/30 text-slate-700 dark:text-slate-400">
                    General
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {plan.rules.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {plan.rules.slice(0, 2).map((rule) => (
                      <Badge
                        key={rule.id}
                        variant={getRuleBadgeVariant(rule.ruleType) as 'info' | 'success' | 'warning' | 'secondary'}
                        className="w-fit text-xs"
                      >
                        {getRuleTypeLabel(rule.ruleType)}
                      </Badge>
                    ))}
                    {plan.rules.length > 2 && (
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        +{plan.rules.length - 2} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No rules</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={plan.isActive ? 'success' : 'outline'} className="font-medium">
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {plan._count.commissionCalculations > 0 ? (
                  <Badge variant="info" className="font-semibold">
                    {plan._count.commissionCalculations}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(plan.createdAt)}
              </TableCell>
              <TableCell>
                <PlanActions plan={plan} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PlansTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-8 text-center text-muted-foreground">
        Loading commission plans...
      </div>
    </div>
  )
}

export default async function PlansPage(props: {
  searchParams: Promise<{ search?: string; create?: string }>
}) {
  const searchParams = await props.searchParams
  const projectsResult = await getProjects()
  const projects = projectsResult.success ? projectsResult.data : []
  const openCreateDialog = searchParams.create === '1' || searchParams.create === 'true'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">Commission Plans</h1>
          <p className="text-muted-foreground">
            Define how commissions are calculated
          </p>
        </div>
        <CommissionPlanFormDialog projects={projects} defaultOpen={openCreateDialog} />
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1" action="/dashboard/plans" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search plans..."
              defaultValue={searchParams.search}
              className="pl-9 border-emerald-500/20 focus:border-emerald-500/40 focus:ring-emerald-500/20"
            />
          </div>
        </form>
      </div>

      <Suspense fallback={<PlansTableSkeleton />}>
        <PlansTable searchQuery={searchParams.search} />
      </Suspense>
    </div>
  )
}
