import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getClients } from '@/app/actions/clients'
import { getTerritories } from '@/app/actions/territories'
import { ClientFormDialog } from '@/components/clients/client-form-dialog'
import { ClientActions } from '@/components/clients/client-actions'
import { formatDate } from '@/lib/utils'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Clients | CommissionFlow',
  description: 'Manage your clients',
}

async function ClientsTable({ searchQuery }: { searchQuery?: string }) {
  const [clientsResult, territoriesResult] = await Promise.all([
    getClients(),
    getTerritories(),
  ])

  if (!clientsResult.success) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {clientsResult.error}
      </div>
    )
  }

  let clients = clientsResult.data || []
  const territories = territoriesResult.success ? territoriesResult.data || [] : []

// Filter by search query
if (searchQuery && clients.length > 0) {
  const query = searchQuery.toLowerCase()
  clients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
  )
}

  if (clients.length === 0) {
    if (searchQuery) {
      return (
        <div data-testid="empty-state">
          <EmptyState
            icon={Search}
            title="No clients found"
            description={`No clients match "${searchQuery}". Try a different search term.`}
          />
        </div>
      )
    }

    return (
      <div data-testid="empty-state">
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Get started by adding your first client. Clients are the companies or individuals you work with."
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-purple-500/10 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            {territories.length > 0 && <TableHead className="font-semibold">Territory</TableHead>}
            <TableHead className="font-semibold">Projects</TableHead>
            <TableHead className="font-semibold">Added</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              data-testid="client-row"
              className="hover:bg-purple-500/5 transition-colors border-b border-purple-500/5"
            >
              <TableCell>
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  data-testid="client-name"
                  className="font-medium text-purple-700 dark:text-purple-400 hover:underline hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                >
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  data-testid="client-status-badge"
                  variant={(client as any).status === 'ACTIVE' ? 'success' : (client as any).status === 'PROSPECTIVE' ? 'info' : (client as any).status === 'INACTIVE' ? 'secondary' : 'outline'}
                  className="font-medium"
                >
                  {(client as any).status || 'ACTIVE'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.email || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.phone || '—'}
              </TableCell>
              {territories.length > 0 && (
                <TableCell>
                  {(client as any).territory?.name ? (
                    <Badge variant="outline" className="border-purple-500/30 text-purple-700 dark:text-purple-400">
                      {(client as any).territory.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                {client.projects.length > 0 ? (
                  <Badge
                    variant={client.projects.length > 5 ? 'success' : client.projects.length > 2 ? 'info' : 'secondary'}
                    className="font-semibold"
                  >
                    {client.projects.length}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(client.createdAt)}
              </TableCell>
              <TableCell>
                <ClientActions client={client} territories={territories} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ClientsTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-8 text-center text-muted-foreground">Loading clients...</div>
    </div>
  )
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string; create?: string }
}) {
  const territoriesResult = await getTerritories()
  const territories = territoriesResult.success ? territoriesResult.data || [] : []
  const clientsResult = await getClients()
  const clients = clientsResult.success ? clientsResult.data || [] : []

  const totalClients = clients.length
  const activeClients = clients.filter((client) => {
    const status = ((client as any).status ?? 'ACTIVE').toString().toLowerCase()
    return status === 'active'
  }).length
  const activeProjects = clients.reduce((sum, c) =>
    sum + c.projects.filter((p: any) => p.status === 'active').length, 0
  )

  const openCreateDialog = searchParams.create === '1' || searchParams.create === 'true'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and their projects
          </p>
        </div>
        <ClientFormDialog territories={territories} defaultOpen={openCreateDialog} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/5 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-500/20 p-3">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{activeClients}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-3">
              <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{activeProjects}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1" action="/dashboard/clients" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              data-testid="client-search-input"
              placeholder="Search clients..."
              defaultValue={searchParams.search}
              className="pl-9 border-purple-500/20 focus:border-purple-500/40 focus:ring-purple-500/20"
            />
          </div>
        </form>
      </div>

      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTable searchQuery={searchParams.search} />
      </Suspense>
    </div>
  )
}
