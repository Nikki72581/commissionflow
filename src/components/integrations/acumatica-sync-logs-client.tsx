'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Loader2, RotateCcw, ChevronDown, ChevronRight, AlertCircle, XCircle, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { undoAcumaticaSync } from '@/actions/integrations/acumatica/sync'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

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
  skipDetails: Array<{ invoiceRef: string; reason: string }> | null
  errorDetails: Array<{ invoiceRef: string; error: string }> | null
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

function SyncLogDetailsView({
  skipDetails,
  errorDetails
}: {
  skipDetails: Array<{ invoiceRef: string; reason: string }> | null
  errorDetails: Array<{ invoiceRef: string; error: string }> | null
}) {
  const [skipSearchTerm, setSkipSearchTerm] = useState('')
  const [errorSearchTerm, setErrorSearchTerm] = useState('')

  const filteredSkips = skipDetails?.filter(
    (skip) =>
      skip.invoiceRef.toLowerCase().includes(skipSearchTerm.toLowerCase()) ||
      skip.reason.toLowerCase().includes(skipSearchTerm.toLowerCase())
  ) || []

  const filteredErrors = errorDetails?.filter(
    (error) =>
      error.invoiceRef.toLowerCase().includes(errorSearchTerm.toLowerCase()) ||
      error.error.toLowerCase().includes(errorSearchTerm.toLowerCase())
  ) || []

  const hasSkips = (skipDetails?.length ?? 0) > 0
  const hasErrors = (errorDetails?.length ?? 0) > 0

  if (!hasSkips && !hasErrors) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No errors or skipped records for this sync.
      </div>
    )
  }

  return (
    <Tabs defaultValue={hasErrors ? 'errors' : 'skipped'} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="errors" className="gap-2">
          <XCircle className="h-4 w-4" />
          Errors ({errorDetails?.length ?? 0})
        </TabsTrigger>
        <TabsTrigger value="skipped" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Skipped ({skipDetails?.length ?? 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="errors" className="mt-4">
        {hasErrors ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice reference or error..."
                value={errorSearchTerm}
                onChange={(e) => setErrorSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredErrors.length > 0 ? (
                filteredErrors.map((error, idx) => (
                  <Card key={idx} className="border-red-200 dark:border-red-900">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-medium text-red-700 dark:text-red-400">
                            {error.invoiceRef}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 break-words">
                            {error.error}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No errors match your search.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No errors occurred during this sync.
          </div>
        )}
      </TabsContent>

      <TabsContent value="skipped" className="mt-4">
        {hasSkips ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice reference or reason..."
                value={skipSearchTerm}
                onChange={(e) => setSkipSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredSkips.length > 0 ? (
                filteredSkips.map((skip, idx) => (
                  <Card key={idx} className="border-amber-200 dark:border-amber-900">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-medium text-amber-700 dark:text-amber-400">
                            {skip.invoiceRef}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 break-words">
                            {skip.reason}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No skipped records match your search.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No records were skipped during this sync.
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

export function AcumaticaSyncLogsClient({ logs }: AcumaticaSyncLogsClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

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

  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId)
  }

  return (
    <div className="space-y-2">
      {/* Column Headers */}
      <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
        <div className="w-8"></div>
        <div>Started</div>
        <div>Status</div>
        <div>Triggered By</div>
        <div>Processed</div>
        <div>Created</div>
        <div>Errors</div>
        <div className="text-right">Actions</div>
      </div>

      {logs.map((log) => {
        const createdSummary = `${log.salesCreated} sales / ${log.clientsCreated} clients / ${log.projectsCreated} projects`
        const processedSummary = `${log.invoicesProcessed}/${log.invoicesFetched} invoices`
        const isExpanded = expandedLogId === log.id
        const hasDetails = (log.skipDetails?.length ?? 0) > 0 || (log.errorDetails?.length ?? 0) > 0

        return (
          <div key={log.id} className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
              <div className="flex items-center">
                {hasDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(log.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {format(new Date(log.startedAt), 'PPP p')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {log.completedAt
                    ? `Completed ${format(new Date(log.completedAt), 'p')}`
                    : 'In progress'}
                </div>
              </div>
              <div>
                <Badge variant={STATUS_VARIANT[log.status] || 'outline'}>{log.status}</Badge>
              </div>
              <div>
                <div className="text-sm">
                  {log.triggeredBy?.name || log.triggeredBy?.email || 'System'}
                </div>
                <div className="text-xs text-muted-foreground">{log.syncType}</div>
              </div>
              <div className="text-sm">
                {processedSummary}
                <div className="text-xs text-muted-foreground">Skipped: {log.invoicesSkipped}</div>
              </div>
              <div className="text-sm">{createdSummary}</div>
              <div className="text-sm">
                <span className={log.errorsCount > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                  {log.errorsCount}
                </span>
              </div>
              <div className="flex justify-end">
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
              </div>
            </div>

            {isExpanded && hasDetails && (
              <div className="border-t bg-muted/30 p-4">
                <SyncLogDetailsView
                  skipDetails={log.skipDetails}
                  errorDetails={log.errorDetails}
                />
              </div>
            )}
          </div>
        )
      })}

      {logs.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8">
          No sync logs available yet.
        </div>
      )}
    </div>
  )
}
