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
  const [plansResult, projectsResult] = await Promise.all([
    getCommissionPlans(),
    getProjects(),
  ])

  if (!plansResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {plansResult.error}
      </div>
    )
  }

  if (!projectsResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {projectsResult.error}
      </div>
    )
  }

  let plans = plansResult.data || []
  const projects = projectsResult.data || []

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
        />
      )
    }

    return (
      <EmptyState
        icon={FileText}
        title="No commission plans yet"
        description="Create your first commission plan to define how commissions are calculated."
      />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Rules</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Calculations</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className="font-medium hover:underline"
                >
                  {plan.name}
                </Link>
                {plan.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {plan.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                {plan.project ? (
                  <Link
                    href={`/dashboard/projects/${plan.project.id}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {plan.project.name}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">General</span>
                )}
              </TableCell>
              <TableCell>
                {plan.rules.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {plan.rules.slice(0, 2).map((rule, idx) => (
                      <Badge key={rule.id} variant="secondary" className="w-fit">
                        {getRuleTypeLabel(rule.ruleType)}
                      </Badge>
                    ))}
                    {plan.rules.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{plan.rules.length - 2} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No rules</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={plan.isActive ? 'default' : 'outline'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {plan._count.commissionCalculations > 0 ? (
                  <Badge variant="secondary">
                    {plan._count.commissionCalculations}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(plan.createdAt)}
              </TableCell>
              <TableCell>
                <PlanActions plan={plan} projects={projects} />
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
  searchParams: Promise<{ search?: string }>
}) {
  const searchParams = await props.searchParams
  const projectsResult = await getProjects()
  const projects = projectsResult.success ? projectsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Commission Plans</h1>
          <p className="text-muted-foreground">
            Define how commissions are calculated
          </p>
        </div>
        <CommissionPlanFormDialog projects={projects} />
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1" action="/dashboard/plans" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search plans..."
              defaultValue={searchParams.search}
              className="pl-9"
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
