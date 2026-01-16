import { requireAdmin } from '@/lib/auth'
import { Suspense } from 'react'
import {
  CreditCard,
  CheckCircle,
  Sparkles,
  Users,
  Plug,
  BarChart3,
  Key,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { getOrgFeatures, type Feature } from '@/lib/features'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Billing & Subscription | CommissionFlow',
  description: 'Manage your organization subscription and billing',
}

interface PlanFeature {
  name: string
  included: boolean
  feature?: Feature
}

interface Plan {
  id: string
  name: string
  description: string
  price: string
  priceDetail: string
  features: PlanFeature[]
  highlighted?: boolean
  current?: boolean
  comingSoon?: boolean
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals and small teams getting started',
    price: '$0',
    priceDetail: '/month',
    features: [
      { name: 'Unlimited salespeople', included: true },
      { name: 'Commission plans', included: true },
      { name: 'CSV data import', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Email support', included: true },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For growing teams that need more power',
    price: '$49',
    priceDetail: '/month',
    highlighted: true,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Team invitations', included: true, feature: 'invite_members' },
      { name: 'ERP integrations', included: true, feature: 'erp_integration' },
      { name: 'Advanced reporting', included: true, feature: 'advanced_reporting' },
      { name: 'API access', included: true, feature: 'api_access' },
      { name: 'Priority support', included: true },
    ],
  },
]

async function CurrentPlanSection() {
  const features = await getOrgFeatures()

  // Determine current plan based on features
  const hasTeamFeatures = features.includes('invite_members')
  const currentPlan = hasTeamFeatures ? 'team' : 'free'

  const planInfo = plans.find((p) => p.id === currentPlan) || plans[0]

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-primary to-purple-600 p-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your organization's subscription</CardDescription>
            </div>
          </div>
          <Badge
            variant={hasTeamFeatures ? 'success' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {planInfo.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Users}
            title="Team Invitations"
            enabled={features.includes('invite_members')}
          />
          <FeatureCard
            icon={Plug}
            title="ERP Integration"
            enabled={features.includes('erp_integration')}
          />
          <FeatureCard
            icon={BarChart3}
            title="Advanced Reporting"
            enabled={features.includes('advanced_reporting')}
          />
          <FeatureCard
            icon={Key}
            title="API Access"
            enabled={features.includes('api_access')}
          />
        </div>

        {!hasTeamFeatures && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Upgrade to unlock all features
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Get team invitations, ERP integrations, advanced reporting, and more with the
                  Team plan.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  enabled,
}: {
  icon: React.ElementType
  title: string
  enabled: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        enabled
          ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
          : 'border-muted bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${
            enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          }`}
        />
        <span
          className={`text-sm font-medium ${
            enabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-muted-foreground'
          }`}
        >
          {title}
        </span>
        {enabled && (
          <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400 ml-auto" />
        )}
      </div>
    </div>
  )
}

function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  return (
    <Card
      className={`relative ${
        plan.highlighted && !plan.comingSoon
          ? 'border-2 border-primary shadow-lg shadow-primary/10'
          : plan.comingSoon
          ? 'border-2 border-dashed border-muted-foreground/30'
          : isCurrent
          ? 'border-2 border-emerald-500/50'
          : ''
      }`}
    >
      {plan.comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="bg-muted">
            Coming Soon
          </Badge>
        </div>
      )}
      {isCurrent && !plan.comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="success">Current Plan</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${plan.comingSoon ? 'text-muted-foreground' : ''}`}>
            {plan.price}
          </span>
          {plan.priceDetail && (
            <span className="text-muted-foreground">{plan.priceDetail}</span>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${plan.comingSoon ? 'text-muted-foreground' : 'text-emerald-500'}`} />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted mt-0.5 shrink-0" />
              )}
              <span className={feature.included && !plan.comingSoon ? '' : 'text-muted-foreground'}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full ${
            plan.highlighted && !plan.comingSoon
              ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
              : ''
          }`}
          variant={isCurrent || plan.comingSoon ? 'outline' : plan.highlighted ? 'default' : 'outline'}
          disabled={isCurrent || plan.comingSoon}
        >
          {isCurrent ? 'Current Plan' : plan.comingSoon ? 'Coming Soon' : 'Upgrade'}
          {!isCurrent && !plan.comingSoon && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  )
}

async function PricingSection() {
  const features = await getOrgFeatures()

  // Determine current plan based on features
  const hasTeamFeatures = features.includes('invite_members')
  const currentPlanId = hasTeamFeatures ? 'team' : 'free'

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === currentPlanId} />
      ))}
    </div>
  )
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        Loading subscription details...
      </CardContent>
    </Card>
  )
}

export default async function BillingPage() {
  // Verify admin access
  await requireAdmin()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground">
          Manage your organization's subscription plan and billing details
        </p>
      </div>

      {/* Current Plan */}
      <Suspense fallback={<LoadingCard />}>
        <CurrentPlanSection />
      </Suspense>

      {/* Available Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <p className="text-muted-foreground text-sm">
            Choose the plan that best fits your team's needs
          </p>
        </div>

        <Suspense fallback={<LoadingCard />}>
          <PricingSection />
        </Suspense>
      </div>

      {/* Enterprise CTA */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Need more?</h3>
              <p className="text-muted-foreground">
                Contact us for custom enterprise pricing with unlimited salespeople, custom
                integrations, and dedicated support.
              </p>
            </div>
            <Link href="/dashboard/help">
              <Button variant="outline" className="shrink-0">
                Contact Sales
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I change plans at any time?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect
              immediately and billing is prorated.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-muted-foreground">
              Your data is always preserved. If you downgrade, you may lose access to certain
              features but your data remains intact.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Do you offer annual billing?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, annual billing is available with a 20% discount. Contact our sales team for
              details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
