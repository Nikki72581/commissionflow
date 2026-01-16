'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Users, Plug, BarChart3, Key, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Feature } from '@/lib/features'

interface UpgradePromptProps {
  feature: Feature
  title?: string
  description?: string
  variant?: 'card' | 'inline' | 'banner'
}

const featureIcons: Record<Feature, React.ElementType> = {
  invite_members: Users,
  erp_integration: Plug,
  advanced_reporting: BarChart3,
  api_access: Key,
}

const featureDescriptions: Record<Feature, string> = {
  invite_members: 'Invite team members and give salespeople visibility into their commissions.',
  erp_integration: 'Connect to Acumatica, Sage, Dynamics, and other ERP systems to automatically sync sales data.',
  advanced_reporting: 'Access advanced analytics and reporting dashboards.',
  api_access: 'Generate API keys to integrate CommissionFlow with external systems.',
}

const teamPlanFeatures = [
  'Invite team members',
  'ERP integrations (Acumatica, Sage, Dynamics)',
  'Advanced reporting & analytics',
  'Role-based access control',
  'API access for integrations',
  'Priority support',
]

export function UpgradePrompt({
  feature,
  title,
  description,
  variant = 'card',
}: UpgradePromptProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const Icon = featureIcons[feature]
  const featureDescription = description || featureDescriptions[feature]
  const displayTitle = title || 'Upgrade to Team Plan'

  const handleUpgrade = () => {
    setIsLoading(true)
    router.push('/dashboard/settings/billing?upgrade=team')
  }

  if (variant === 'banner') {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 dark:bg-amber-500/20 p-2">
              <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">{displayTitle}</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{featureDescription}</p>
            </div>
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shrink-0"
          >
            {isLoading ? 'Loading...' : 'View Plans'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 dark:bg-amber-500/20 p-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">{displayTitle}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{featureDescription}</p>
            <Button
              variant="link"
              onClick={handleUpgrade}
              disabled={isLoading}
              className="p-0 h-auto text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 mt-2"
            >
              {isLoading ? 'Loading...' : 'Upgrade to Team Plan'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default: card variant
  return (
    <Card className="border-2 border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/5 dark:to-yellow-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-amber-900 dark:text-amber-100">{displayTitle}</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Unlock this feature and more
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-background/50 p-4">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-amber-800 dark:text-amber-200">{featureDescription}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">
            Team Plan includes:
          </h4>
          <ul className="space-y-2">
            {teamPlanFeatures.map((planFeature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {planFeature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
            size="lg"
          >
            {isLoading ? 'Loading...' : 'View Plans'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
