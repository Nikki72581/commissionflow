'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { createApiKeyAction, getApiKeys, revokeApiKeyAction } from '@/app/actions/api-keys'
import { Key, Loader2, Plus, Copy, AlertTriangle, Clock, Shield, CheckCircle2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  isActive: boolean
  lastUsedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  revokedAt: Date | null
  createdBy: {
    firstName: string | null
    lastName: string | null
    email: string
  }
}

const AVAILABLE_SCOPES = [
  { value: 'sales:read', label: 'Read Sales', description: 'View sales transactions' },
  { value: 'sales:write', label: 'Write Sales', description: 'Create, update, and delete sales' },
  { value: 'clients:read', label: 'Read Clients', description: 'View clients' },
  { value: 'clients:write', label: 'Write Clients', description: 'Create, update, and delete clients' },
  { value: 'projects:read', label: 'Read Projects', description: 'View projects' },
  { value: 'projects:write', label: 'Write Projects', description: 'Create, update, and delete projects' },
  { value: 'categories:read', label: 'Read Categories', description: 'View product categories' },
  { value: 'categories:write', label: 'Write Categories', description: 'Create product categories' },
  { value: 'territories:read', label: 'Read Territories', description: 'View territories' },
  { value: 'territories:write', label: 'Write Territories', description: 'Create territories' },
]

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Revoke dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [])

  async function loadApiKeys() {
    try {
      setLoading(true)
      const result = await getApiKeys()

      if (result.success && result.data) {
        setKeys(result.data as ApiKey[])
      } else {
        setError(result.error || 'Failed to load API keys')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim() || selectedScopes.length === 0) {
      setError('Please provide a name and select at least one scope')
      return
    }

    setError(null)
    setCreating(true)

    try {
      const result = await createApiKeyAction({
        name: newKeyName,
        scopes: selectedScopes,
      })

      if (result.success && result.data) {
        setNewKeyResult(result.data.key)
        setSuccess('API key created successfully')
        await loadApiKeys()
        // Don't close dialog yet - show the key
      } else {
        setError(result.error || 'Failed to create API key')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  function handleCloseCreateDialog() {
    setCreateDialogOpen(false)
    setNewKeyName('')
    setSelectedScopes([])
    setNewKeyResult(null)
    setCopied(false)
  }

  async function handleRevokeKey() {
    if (!keyToRevoke) return

    setError(null)
    setRevoking(true)

    try {
      const result = await revokeApiKeyAction(keyToRevoke.id)

      if (result.success) {
        setSuccess('API key revoked successfully')
        await loadApiKeys()
        setRevokeDialogOpen(false)
        setKeyToRevoke(null)
      } else {
        setError(result.error || 'Failed to revoke API key')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setRevoking(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
              API Keys
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage API keys for external integrations (Admin only)
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>
      </div>

      <Separator className="bg-indigo-500/20" />

      {/* Alert Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/90 mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Success</p>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">{success}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess(null)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Active API Keys</CardTitle>
          </div>
          <CardDescription>
            API keys allow external applications to access your CommissionFlow data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first API key to start integrating with external applications
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 border rounded-lg space-y-3 hover:border-primary/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{key.name}</h3>
                        {key.isActive ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <code className="px-2 py-1 bg-muted rounded font-mono text-xs">
                          {key.keyPrefix}...
                        </code>
                        <span>•</span>
                        <span>
                          Created{' '}
                          {new Date(key.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    {key.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setKeyToRevoke(key)
                          setRevokeDialogOpen(true)
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>

                  {/* Scopes */}
                  <div className="flex flex-wrap gap-2">
                    {(key.scopes as string[]).map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    {key.lastUsedAt ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Last used{' '}
                          {new Date(key.lastUsedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Never used</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>Created by {key.createdBy.firstName} {key.createdBy.lastName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900 dark:text-amber-400">Security Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
          <ul className="list-disc list-inside space-y-1">
            <li>Never share your API keys publicly or commit them to version control</li>
            <li>Use environment variables to store API keys in your applications</li>
            <li>Regularly rotate API keys and revoke unused ones</li>
            <li>Use the minimum required scopes for each integration</li>
            <li>Monitor API usage logs for suspicious activity</li>
          </ul>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseCreateDialog()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              {newKeyResult
                ? 'Your API key has been created. Copy it now - you won\'t see it again!'
                : 'Create an API key to allow external applications to access your data'}
            </DialogDescription>
          </DialogHeader>

          {newKeyResult ? (
            /* Show the created key */
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    API Key Created Successfully
                  </p>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Copy your API key now. For security reasons, you won't be able to see it again.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyResult}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(newKeyResult)}
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Store this key securely. You'll need it to authenticate API requests.
                </p>
              </div>
            </div>
          ) : (
            /* Create form */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="keyName"
                  placeholder="Production Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this API key
                </p>
              </div>

              <div className="space-y-3">
                <Label>
                  Scopes <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select the permissions this API key will have
                </p>
                <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div
                      key={scope.value}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => toggleScope(scope.value)}
                    >
                      <Checkbox
                        id={scope.value}
                        checked={selectedScopes.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={scope.value}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {scope.label}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {scope.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {newKeyResult ? (
              <Button onClick={handleCloseCreateDialog} className="w-full">
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCloseCreateDialog}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={creating || !newKeyName.trim() || selectedScopes.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create API Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {keyToRevoke && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="font-semibold">{keyToRevoke.name}</div>
              <div className="text-sm text-muted-foreground">
                <code className="px-2 py-1 bg-muted rounded font-mono text-xs">
                  {keyToRevoke.keyPrefix}...
                </code>
              </div>
            </div>
          )}

          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium mb-1">Warning</p>
                <p>
                  Any applications using this API key will immediately lose access to your data.
                  Make sure to update your integrations before revoking.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={revoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeKey}
              disabled={revoking}
            >
              {revoking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Revoke API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
