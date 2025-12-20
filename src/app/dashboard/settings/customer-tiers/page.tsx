'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Award, CheckCircle, Star, Users, Building2, Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const customerTiers = [
  {
    name: 'STANDARD',
    icon: Users,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    description: 'Default tier for regular customers',
    details: [
      'Applies to most customers by default',
      'Standard commission rates apply',
      'No special requirements',
    ],
    usage: 'Assigned automatically to new clients unless specified otherwise',
  },
  {
    name: 'VIP',
    icon: Star,
    color: 'text-yellow-600 dark:text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    description: 'High-value customers with premium status',
    details: [
      'For top-performing or high-revenue clients',
      'May have different commission rates',
      'Priority handling and support',
    ],
    usage: 'Manually assigned to high-value clients',
  },
  {
    name: 'NEW',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    description: 'Newly acquired customers',
    details: [
      'Identifies recent client acquisitions',
      'May have introductory commission rates',
      'Helps track new business growth',
    ],
    usage: 'Assigned to clients acquired within a defined timeframe',
  },
  {
    name: 'ENTERPRISE',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700',
    description: 'Large enterprise deals and organizations',
    details: [
      'For major corporate accounts',
      'Often have custom commission structures',
      'High-value, strategic partnerships',
    ],
    usage: 'Reserved for enterprise-level clients and partnerships',
  },
]

export default function CustomerTiersPage() {
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Customer Tiers
        </h1>
        <p className="text-muted-foreground mt-2">
          Understanding customer tier classifications and their commission implications
        </p>
      </div>

      <Separator />

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Customer tiers are system-defined classifications
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                These tier values are defined in the database schema and cannot be modified. You can assign these tiers to clients when creating or editing them. Use commission rules to create tier-specific commission rates.
              </p>
              <div className="pt-2">
                <Link href="/dashboard/clients">
                  <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900">
                    Manage Clients
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {customerTiers.map((tier) => {
          const Icon = tier.icon
          return (
            <Card key={tier.name} className={`border-2 ${tier.borderColor}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${tier.bgColor}`}>
                      <Icon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tier.name}
                        <Badge variant="outline" className="font-mono text-xs">
                          enum
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {tier.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Characteristics</h4>
                  <ul className="space-y-2">
                    {tier.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Usage</h4>
                  <p className="text-sm text-muted-foreground">{tier.usage}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* How to Use Section */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Customer Tiers</CardTitle>
          <CardDescription>
            Leverage customer tiers in your commission structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium">Assign Tiers to Clients</h4>
                <p className="text-sm text-muted-foreground">
                  When creating or editing a client, select the appropriate tier from the dropdown menu based on their business relationship and value.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium">Create Tier-Specific Commission Rules</h4>
                <p className="text-sm text-muted-foreground">
                  In your commission plans, create rules with scope set to "Customer Tier" to apply different commission rates based on the client's tier classification.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium">Track Performance by Tier</h4>
                <p className="text-sm text-muted-foreground">
                  Use reports to analyze sales and commission performance across different customer tiers to optimize your sales strategy.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Link href="/dashboard/clients">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Clients
              </Button>
            </Link>
            <Link href="/dashboard/plans">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                <Award className="h-4 w-4 mr-2" />
                Create Commission Rules
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
