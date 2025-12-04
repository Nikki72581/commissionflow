// src/app/api/admin/demo-data/clear/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function DELETE(req: NextRequest) {
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
    await prisma.commissionCalculation.deleteMany({
      where: { organizationId: user.organizationId },
    })

    await prisma.payout.deleteMany({
      where: { organizationId: user.organizationId },
    })

    await prisma.salesTransaction.deleteMany({
      where: { organizationId: user.organizationId },
    })

    await prisma.commissionRule.deleteMany({
      where: { 
        commissionPlan: {
          organizationId: user.organizationId 
        }
      },
    })

    await prisma.commissionPlan.deleteMany({
      where: { organizationId: user.organizationId },
    })

    await prisma.project.deleteMany({
      where: { organizationId: user.organizationId },
    })

    await prisma.client.deleteMany({
      where: { organizationId: user.organizationId },
    })

    // Optionally clear audit logs
    await prisma.auditLog.deleteMany({
      where: { organizationId: user.organizationId },
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