'use client'

import { useTransition } from 'react'
import { format } from 'date-fns'
import { Loader2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { undoAcumaticaSync } from '@/actions/integrations/acumatica/sync'

interface SyncLogEntry {
  id: string
  syncType: string
  status: string
  startedAt: string
  completedAt: string | null
  triggeredBy: {
    id: string
    name: string | null
    email: string | null
  } | null
  invoicesFetched: number
  invoicesProcessed: number
  invoicesSkipped: number
  salesCreated: number
  clientsCreated: number
  projectsCreated: number
  errorsCount: number
}

interface AcumaticaSyncLogsClientProps {
  logs: SyncLogEntry[]
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  SUCCESS: 'success',
  PARTIAL_SUCCESS: 'secondary',
  FAILED: 'destructive',
  IN_PROGRESS: 'outline',
  STARTED: 'outline',
}

export function AcumaticaSyncLogsClient({ logs }: AcumaticaSyncLogsClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleUndo = (logId: string) => {
    startTransition(async () => {
      const result = await undoAcumaticaSync(logId)
      if (result.success && result.data) {
        toast({
          title: 'Sync reverted',
          description: `Removed ${result.data.deletedSales} sales, ${result.data.deletedProjects} projects, ${result.data.deletedClients} clients.`,
        })
        router.refresh()
        return
      }

      toast({
        title: 'Unable to undo',
        description: result.error || 'Failed to undo sync',
        variant: 'destructive',
      })
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Started</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Triggered By</TableHead>
          <TableHead>Processed</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Errors</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const createdSummary = `${log.salesCreated} sales / ${log.clientsCreated} clients / ${log.projectsCreated} projects`
          const processedSummary = `${log.invoicesProcessed}/${log.invoicesFetched} invoices`
          return (
            <TableRow key={log.id}>
              <TableCell>
                <div className="text-sm font-medium">
                  {format(new Date(log.startedAt), 'PPP p')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {log.completedAt
                    ? `Completed ${format(new Date(log.completedAt), 'p')}`
                    : 'In progress'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[log.status] || 'outline'}>{log.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {log.triggeredBy?.name || log.triggeredBy?.email || 'System'}
                </div>
                <div className="text-xs text-muted-foreground">{log.syncType}</div>
              </TableCell>
              <TableCell className="text-sm">
                {processedSummary}
                <div className="text-xs text-muted-foreground">Skipped: {log.invoicesSkipped}</div>
              </TableCell>
              <TableCell className="text-sm">{createdSummary}</TableCell>
              <TableCell className="text-sm">{log.errorsCount}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleUndo(log.id)}
                  disabled={
                    isPending ||
                    (log.salesCreated + log.clientsCreated + log.projectsCreated === 0) ||
                    !['SUCCESS', 'PARTIAL_SUCCESS'].includes(log.status)
                  }
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Undo
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
