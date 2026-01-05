// src/app/api/admin/demo-data/clear/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and verify admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, organizationId: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Delete all data for this organization
    // Order matters due to foreign key constraints

    // 1. Delete commission calculations (depends on payouts)
    await prisma.commissionCalculation.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 2. Delete payouts
    await prisma.payout.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 3. Delete sales transactions
    await prisma.salesTransaction.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 4. Delete commission rules (depends on commission plans)
    await prisma.commissionRule.deleteMany({
      where: {
        commissionPlan: {
          organizationId: user.organizationId
        }
      },
    })

    // 5. Delete commission plans
    await prisma.commissionPlan.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 6. Delete projects
    await prisma.project.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 7. Delete clients
    await prisma.client.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 8. Delete product categories
    await prisma.productCategory.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 9. Delete territories
    await prisma.territory.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 10. Delete integration sync logs
    const integration = await prisma.acumaticaIntegration.findUnique({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })

    if (integration) {
      await prisma.integrationSyncLog.deleteMany({
        where: { integrationId: integration.id },
      })

      // 11. Delete salesperson mappings
      await prisma.acumaticaSalespersonMapping.deleteMany({
        where: { integrationId: integration.id },
      })

      // 12. Delete the integration itself
      await prisma.acumaticaIntegration.delete({
        where: { id: integration.id },
      })
    }

    // 13. Delete audit logs
    await prisma.auditLog.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // 14. Delete placeholder users (keep real invited users)
    await prisma.user.deleteMany({
      where: {
        organizationId: user.organizationId,
        isPlaceholder: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'All demo data cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing demo data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}