// src/app/dashboard/commissions/payouts/page.tsx
import { PageHeader } from '@/components/navigation/breadcrumbs'
import { BulkPayoutDialog } from '@/components/commissions/bulk-payout-dialog'
import { BulkActionsToolbar } from '@/components/commissions/bulk-actions-toolbar'

export default function BulkPayoutsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Payouts"
        description="Process multiple commission payments at once"
        breadcrumbs={[
          { title: 'Commissions', href: '/dashboard/commissions' },
          { title: 'Bulk Payouts' }
        ]}
      />
    
    </div>
  )
}