'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CommissionPlanFormDialog } from './plan-form-dialog'
import { deleteCommissionPlan, updateCommissionPlan } from '@/app/actions/commission-plans'

interface CommissionPlan {
  id: string
  name: string
  description?: string | null
  projectId?: string | null
  isActive: boolean
}

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
}

interface PlanActionsProps {
  plan: CommissionPlan
  projects: Project[]
}

export function PlanActions({ plan, projects }: PlanActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteCommissionPlan(plan.id)
    
    if (result.success) {
      setShowDeleteDialog(false)
      router.refresh()
    } else {
      alert(result.error)
      setIsDeleting(false)
    }
  }

  async function handleToggleActive() {
    setIsToggling(true)
    const result = await updateCommissionPlan(plan.id, {
      isActive: !plan.isActive,
    })
    
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsToggling(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isToggling}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <CommissionPlanFormDialog
            plan={plan}
            projects={projects}
            trigger={
              <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </button>
            }
          />
          <DropdownMenuItem onClick={handleToggleActive} disabled={isToggling}>
            {plan.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{plan.name}</strong> and all its
              rules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
