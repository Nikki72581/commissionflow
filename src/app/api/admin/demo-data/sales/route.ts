// src/app/api/admin/demo-data/sales/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { faker } from '@faker-js/faker'
import { CommissionStatus, CommissionRuleType } from '@prisma/client'

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function calculateCommission(saleAmount: number, commissionPlanId: string) {
  // Get commission rules for this plan
  const rules = await prisma.commissionRule.findMany({
    where: { commissionPlanId },
  })

  let commissionAmount = 0

  for (const rule of rules) {
    if (rule.ruleType === CommissionRuleType.PERCENTAGE) {
      commissionAmount += saleAmount * (rule.percentage! / 100)
    } else if (rule.ruleType === CommissionRuleType.FLAT_AMOUNT) {
      commissionAmount += rule.flatAmount!
    } else if (rule.ruleType === CommissionRuleType.TIERED) {
      if (saleAmount <= rule.tierThreshold!) {
        commissionAmount += saleAmount * (rule.percentage! / 100)
      } else {
        commissionAmount += rule.tierThreshold! * (rule.percentage! / 100)
        commissionAmount += (saleAmount - rule.tierThreshold!) * (rule.tierPercentage! / 100)
      }
    }
  }

  // Apply min/max caps if any rule has them
  const maxCap = Math.max(...rules.filter(r => r.maxAmount).map(r => r.maxAmount!), 0)
  const minCap = Math.max(...rules.filter(r => r.minAmount).map(r => r.minAmount!), 0)
  
  if (maxCap > 0) commissionAmount = Math.min(commissionAmount, maxCap)
  if (minCap > 0) commissionAmount = Math.max(commissionAmount, minCap)

  return Math.round(commissionAmount * 100) / 100
}

export async function POST(req: NextRequest) {
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

    const { count = 10 } = await req.json()

    // Get required data
    const [projects, salespeople, commissionPlans] = await Promise.all([
      prisma.project.findMany({
        where: { organizationId: user.organizationId },
      }),
      prisma.user.findMany({
        where: { 
          organizationId: user.organizationId,
          role: 'SALESPERSON'
        },
      }),
      prisma.commissionPlan.findMany({
        where: { organizationId: user.organizationId },
      }),
    ])

    if (projects.length === 0) {
      return NextResponse.json({ 
        error: 'No projects found. Please generate projects first.' 
      }, { status: 400 })
    }

    if (salespeople.length === 0) {
      return NextResponse.json({ 
        error: 'No salespeople found in your organization.' 
      }, { status: 400 })
    }

    if (commissionPlans.length === 0) {
      return NextResponse.json({ 
        error: 'No commission plans found. Please create at least one commission plan first.' 
      }, { status: 400 })
    }

    // Generate sales and commissions
    const sales = []
    const commissions = []
    const startDate = new Date('2024-01-01')
    const endDate = new Date()

    for (let i = 0; i < count; i++) {
      const project = randomItem(projects)
      const salesperson = randomItem(salespeople)
      const transactionDate = randomDate(startDate, endDate)
      const amount = Math.round(5000 + Math.random() * 95000) // $5k-$100k

      // Create sales transaction
      const sale = await prisma.salesTransaction.create({
        data: {
          amount,
          projectId: project.id,
          userId: salesperson.id,
          organizationId: user.organizationId,
          transactionDate,
          description: faker.commerce.productDescription(),
          invoiceNumber: `INV-${faker.string.alphanumeric(8).toUpperCase()}`,
        },
      })
      sales.push(sale)

      // Find applicable commission plan (prefer project-specific, fallback to org-wide)
      const applicablePlan = commissionPlans.find(p => p.projectId === project.id) || 
                            randomItem(commissionPlans.filter(p => !p.projectId && p.isActive))

      if (!applicablePlan) continue

      // Calculate commission
      const commissionAmount = await calculateCommission(amount, applicablePlan.id)

      // Determine status based on how old the transaction is
      const daysSince = (new Date().getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
      let status: CommissionStatus
      let approvedAt: Date | null = null
      let paidAt: Date | null = null

      if (daysSince < 7) {
        status = CommissionStatus.PENDING
      } else if (daysSince < 14) {
        status = CommissionStatus.CALCULATED
      } else if (daysSince < 30) {
        status = CommissionStatus.APPROVED
        approvedAt = new Date(transactionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      } else {
        status = CommissionStatus.PAID
        approvedAt = new Date(transactionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        paidAt = new Date(transactionDate.getTime() + 21 * 24 * 60 * 60 * 1000)
      }

      // Create commission calculation
      const commission = await prisma.commissionCalculation.create({
        data: {
          salesTransactionId: sale.id,
          commissionPlanId: applicablePlan.id,
          userId: salesperson.id,
          organizationId: user.organizationId,
          amount: commissionAmount,
          status,
          calculatedAt: transactionDate,
          approvedAt,
          paidAt,
        },
      })
      commissions.push(commission)
    }

    return NextResponse.json({ 
      success: true, 
      salesCount: sales.length,
      commissionsCount: commissions.length,
      sales: sales.map(s => ({ 
        id: s.id, 
        amount: s.amount, 
        invoiceNumber: s.invoiceNumber 
      })),
      commissions: commissions.map(c => ({ 
        id: c.id, 
        amount: c.amount, 
        status: c.status 
      }))
    })
  } catch (error: any) {
    console.error('Error generating sales:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}