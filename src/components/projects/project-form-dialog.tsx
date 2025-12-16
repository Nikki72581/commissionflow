'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProject, updateProject } from '@/app/actions/projects'
import type { Client, ProjectWithClient } from '@/lib/types'

interface ProjectFormDialogProps {
  clients: Client[]
  project?: Pick<ProjectWithClient, 'id' | 'name' | 'description' | 'clientId' | 'startDate' | 'endDate' | 'status'>
  defaultClientId?: string
  trigger?: React.ReactNode
}

export function ProjectFormDialog({
  clients,
  project,
  defaultClientId,
  trigger,
}: ProjectFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState(
    project?.clientId || defaultClientId || ''
  )
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'completed' | 'cancelled'>(
    (project?.status as 'active' | 'completed' | 'cancelled') || 'active'
  )

  const isEdit = !!project

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      clientId: selectedClientId,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      status: selectedStatus,
    }

    // Validate that start date is not after end date
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      if (startDate > endDate) {
        setError('Start date cannot be after end date')
        setLoading(false)
        return
      }
    }

    try {
      const result = isEdit
        ? await updateProject(project.id, data)
        : await createProject(data)

      if (result.success) {
        setOpen(false)
        router.refresh()
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
            New Project
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the project information below.'
                : 'Add a new project for your client.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={project?.name}
                placeholder="Website Redesign"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clientId">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={project?.description || ''}
                placeholder="Project details and objectives..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={
                    project?.startDate
                      ? new Date(project.startDate).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    project?.endDate
                      ? new Date(project.endDate).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={value => setSelectedStatus(value as 'active' | 'completed' | 'cancelled')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={loading || !selectedClientId}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
