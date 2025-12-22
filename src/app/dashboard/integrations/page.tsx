import { requireAdmin } from '@/lib/auth'
import {
  Plug,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  RefreshCw,
  Calendar,
  Database
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

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Integrations | CommissionFlow',
  description: 'Manage your accounting system integrations',
}

interface Integration {
  id: string
  name: string
  description: string
  logo: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  features: string[]
  setupUrl?: string
}

const integrations: Integration[] = [
  {
    id: 'acumatica',
    name: 'Acumatica',
    description: 'Cloud-based ERP and accounting software for growing businesses',
    logo: '🏢',
    status: 'connected',
    lastSync: '2 hours ago',
    features: [
      'Automatic sales data sync',
      'Customer account matching',
      'Real-time commission calculations',
      'Invoice integration'
    ],
    setupUrl: 'https://acumatica.com'
  },
  {
    id: 'sage-intacct',
    name: 'Sage Intacct',
    description: 'Cloud financial management and accounting software',
    logo: '💼',
    status: 'disconnected',
    features: [
      'Financial data synchronization',
      'Multi-entity support',
      'Automated GL posting',
      'Advanced reporting'
    ],
    setupUrl: 'https://www.sageintacct.com'
  },
  {
    id: 'dynamics-bc',
    name: 'Microsoft Dynamics BC',
    description: 'Business Central - comprehensive business management solution',
    logo: '🔷',
    status: 'disconnected',
    features: [
      'Sales order integration',
      'Customer data sync',
      'Commission automation',
      'Power BI integration'
    ],
    setupUrl: 'https://dynamics.microsoft.com'
  }
]

export default async function IntegrationsPage() {
  // Verify admin access
  await requireAdmin()

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const totalIntegrations = integrations.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect your accounting systems to automate commission calculations
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/5 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-500/20 p-3">
              <Plug className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Integrations</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalIntegrations}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connected</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{connectedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {integrations.find(i => i.status === 'connected')?.lastSync || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className={`border-2 transition-all hover:shadow-lg ${
              integration.status === 'connected'
                ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent'
                : 'border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{integration.logo}</div>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      {integration.name}
                      {integration.status === 'connected' && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                        </Badge>
                      )}
                      {integration.status === 'disconnected' && (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Not Connected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Configure
                      </Button>
                      <Button variant="destructive" size="sm">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Plug className="h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Last Sync Info */}
                {integration.status === 'connected' && integration.lastSync && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Last synchronized: <span className="font-medium text-emerald-700 dark:text-emerald-400">{integration.lastSync}</span></span>
                  </div>
                )}

                {/* Features List */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Key Features:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {integration.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm bg-white/50 dark:bg-slate-800/50 rounded-md p-2 border border-purple-500/10"
                      >
                        <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learn More Link */}
                {integration.setupUrl && (
                  <div className="pt-2">
                    <a
                      href={integration.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
                    >
                      Learn more about {integration.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Having trouble connecting your accounting system? Our support team is here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              View Documentation
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
