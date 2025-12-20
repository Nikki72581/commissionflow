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
        <EmptyState
          icon={Search}
          title="No clients found"
          description={`No clients match "${searchQuery}". Try a different search term.`}
        />
      )
    }

    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Get started by adding your first client. Clients are the companies or individuals you work with."
      />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            {territories.length > 0 && <TableHead>Territory</TableHead>}
            <TableHead>Projects</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="font-medium hover:underline"
                >
                  {client.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.email || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.phone || '—'}
              </TableCell>
              {territories.length > 0 && (
                <TableCell className="text-muted-foreground">
                  {(client as any).territory?.name || '—'}
                </TableCell>
              )}
              <TableCell>
                {client.projects.length > 0 ? (
                  <Badge variant="secondary">{client.projects.length}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
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
  searchParams: { search?: string }
}) {
  const territoriesResult = await getTerritories()
  const territories = territoriesResult.success ? territoriesResult.data || [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and their projects
          </p>
        </div>
        <ClientFormDialog territories={territories} />
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1" action="/dashboard/clients" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search clients..."
              defaultValue={searchParams.search}
              className="pl-9"
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
