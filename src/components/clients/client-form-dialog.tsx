'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient, updateClient } from '@/app/actions/clients'
import type { Client } from '@/lib/types'

interface ClientFormDialogProps {
  client?: Client
  trigger?: React.ReactNode
}

const MAX_NAME_LENGTH = 200

export function ClientFormDialog({ client, trigger }: ClientFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [nameLength, setNameLength] = useState(client?.name.length || 0)
  const [nameError, setNameError] = useState<string | null>(null)

  const isEdit = !!client

  function validateName(name: string): boolean {
    setNameError(null)

    if (name.length === 0) {
      setNameError('Client name is required')
      return false
    }

    if (name.length > MAX_NAME_LENGTH) {
      setNameError(`Client name must be ${MAX_NAME_LENGTH} characters or less`)
      return false
    }

    // Check for potentially dangerous patterns
    if (/<[^>]*>/.test(name) || /javascript:/i.test(name) || /on\w+\s*=/i.test(name)) {
      setNameError('Client name contains invalid characters')
      return false
    }

    return true
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setNameLength(value.length)

    if (value.length > 0) {
      validateName(value)
    } else {
      setNameError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    // Client-side validation
    if (!validateName(name)) {
      setLoading(false)
      return
    }

    const data = {
      name,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      notes: formData.get('notes') as string,
    }

    try {
      const result = isEdit
        ? await updateClient(client.id, data)
        : await createClient(data)

      if (result.success) {
        // Show success animation
        setShowSuccess(true)

        // Wait for animation, then close and refresh
        setTimeout(() => {
          setShowSuccess(false)
          setOpen(false)
          router.refresh()
        }, 1500)
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-in zoom-in duration-500">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <p className="mt-4 text-lg font-semibold animate-in fade-in slide-in-from-bottom-4 duration-700">
              Success!
            </p>
            <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Client {isEdit ? 'updated' : 'created'} successfully
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Client' : 'New Client'}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? 'Update the client information below.'
                  : 'Add a new client to your organization.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={`text-xs ${
                      nameLength > MAX_NAME_LENGTH
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {nameLength}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                <Input
                  id="name"
                  name="name"
                  defaultValue={client?.name}
                  placeholder="Acme Corporation"
                  required
                  onChange={handleNameChange}
                  maxLength={MAX_NAME_LENGTH + 50}
                  className={nameError ? 'border-destructive' : ''}
                />
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client?.email || ''}
                placeholder="contact@acme.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client?.phone || ''}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={client?.address || ''}
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client?.notes || ''}
                placeholder="Additional notes about this client..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
