import { PrismaClient, UserRole, CustomerTier, ClientStatus, CommissionRuleType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎭 Setting up demo organization...')

  // Check if demo org already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: 'demo' },
  })

  if (existingOrg) {
    console.log('✅ Demo organization already exists, skipping.')
    return
  }

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Sales Co.',
      slug: 'demo',
      planTier: 'PROFESSIONAL',
      requireProjects: true,
    },
  })

  // Create demo users (no clerkId — placeholder users)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acme-demo.commissionflow.app',
      firstName: 'Alex',
      lastName: 'Rivera',
      role: UserRole.ADMIN,
      organizationId: org.id,
      isPlaceholder: true,
    },
  })

  const salesUser1 = await prisma.user.create({
    data: {
      email: 'jordan@acme-demo.commissionflow.app',
      firstName: 'Jordan',
      lastName: 'Kim',
      role: UserRole.SALESPERSON,
      organizationId: org.id,
      isPlaceholder: true,
    },
  })

  const salesUser2 = await prisma.user.create({
    data: {
      email: 'sam@acme-demo.commissionflow.app',
      firstName: 'Sam',
      lastName: 'Chen',
      role: UserRole.SALESPERSON,
      organizationId: org.id,
      isPlaceholder: true,
    },
  })

  // Clients
  const globalTech = await prisma.client.create({
    data: {
      name: 'GlobalTech Systems',
      email: 'procurement@globaltech.demo',
      phone: '415-555-0100',
      address: '1 Infinite Loop, San Francisco, CA',
      tier: CustomerTier.ENTERPRISE,
      status: ClientStatus.ACTIVE,
      organizationId: org.id,
    },
  })

  const brightMedia = await prisma.client.create({
    data: {
      name: 'Bright Media Group',
      email: 'hello@brightmedia.demo',
      phone: '212-555-0200',
      address: '350 Fifth Ave, New York, NY',
      tier: CustomerTier.VIP,
      status: ClientStatus.ACTIVE,
      organizationId: org.id,
    },
  })

  const northstarRetail = await prisma.client.create({
    data: {
      name: 'Northstar Retail',
      email: 'ops@northstar.demo',
      phone: '312-555-0300',
      tier: CustomerTier.STANDARD,
      status: ClientStatus.ACTIVE,
      organizationId: org.id,
    },
  })

  const launchpadStartup = await prisma.client.create({
    data: {
      name: 'Launchpad Startup',
      email: 'founders@launchpad.demo',
      phone: '650-555-0400',
      tier: CustomerTier.NEW,
      status: ClientStatus.ACTIVE,
      organizationId: org.id,
    },
  })

  const sunsetCo = await prisma.client.create({
    data: {
      name: 'Sunset Co.',
      email: 'info@sunsetco.demo',
      tier: CustomerTier.STANDARD,
      status: ClientStatus.INACTIVE,
      organizationId: org.id,
    },
  })

  // Projects
  const erp = await prisma.project.create({
    data: {
      name: 'ERP Platform Implementation',
      description: 'Full ERP rollout across 5 offices',
      clientId: globalTech.id,
      organizationId: org.id,
      status: 'active',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-12-31'),
    },
  })

  const campaignPortal = await prisma.project.create({
    data: {
      name: 'Campaign Portal',
      description: 'Self-serve ad campaign management portal',
      clientId: brightMedia.id,
      organizationId: org.id,
      status: 'active',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-09-30'),
    },
  })

  const inventorySystem = await prisma.project.create({
    data: {
      name: 'Inventory Management System',
      description: 'Real-time inventory tracking',
      clientId: northstarRetail.id,
      organizationId: org.id,
      status: 'in-progress',
      startDate: new Date('2025-02-01'),
    },
  })

  const mvp = await prisma.project.create({
    data: {
      name: 'MVP Build',
      description: 'Initial product build for launch',
      clientId: launchpadStartup.id,
      organizationId: org.id,
      status: 'active',
      startDate: new Date('2025-04-01'),
    },
  })

  await prisma.project.create({
    data: {
      name: 'Legacy System Audit',
      description: 'Completed audit of legacy infrastructure',
      clientId: globalTech.id,
      organizationId: org.id,
      status: 'completed',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-11-30'),
    },
  })

  // Commission Plans
  const standardPlan = await prisma.commissionPlan.create({
    data: {
      name: 'Standard Sales Plan',
      description: 'Standard 10% commission on all sales',
      organizationId: org.id,
      isActive: true,
    },
  })

  await prisma.commissionRule.create({
    data: {
      commissionPlanId: standardPlan.id,
      ruleType: CommissionRuleType.PERCENTAGE,
      percentage: 10.0,
      scope: 'GLOBAL',
      priority: 'DEFAULT',
    },
  })

  const enterprisePlan = await prisma.commissionPlan.create({
    data: {
      name: 'Enterprise Accelerator',
      description: '15% commission on enterprise deals',
      organizationId: org.id,
      isActive: true,
    },
  })

  await prisma.commissionRule.create({
    data: {
      commissionPlanId: enterprisePlan.id,
      ruleType: CommissionRuleType.PERCENTAGE,
      percentage: 15.0,
      customerTier: CustomerTier.ENTERPRISE,
      scope: 'CUSTOMER_TIER',
      priority: 'CUSTOMER_TIER',
    },
  })

  const tieredPlan = await prisma.commissionPlan.create({
    data: {
      name: 'Tiered Accelerator Plan',
      description: 'Progressive rates — the bigger the deal, the better the rate',
      organizationId: org.id,
      isActive: true,
    },
  })

  await prisma.commissionRule.createMany({
    data: [
      {
        commissionPlanId: tieredPlan.id,
        ruleType: CommissionRuleType.PERCENTAGE,
        percentage: 6.0,
        minSaleAmount: 0,
        maxSaleAmount: 10000,
        scope: 'GLOBAL',
        priority: 'DEFAULT',
      },
      {
        commissionPlanId: tieredPlan.id,
        ruleType: CommissionRuleType.PERCENTAGE,
        percentage: 8.0,
        minSaleAmount: 10001,
        maxSaleAmount: 50000,
        scope: 'GLOBAL',
        priority: 'DEFAULT',
      },
      {
        commissionPlanId: tieredPlan.id,
        ruleType: CommissionRuleType.PERCENTAGE,
        percentage: 12.0,
        minSaleAmount: 50001,
        scope: 'GLOBAL',
        priority: 'DEFAULT',
      },
    ],
  })

  const erpProjectPlan = await prisma.commissionPlan.create({
    data: {
      name: 'ERP Project Bonus Plan',
      description: 'Custom 13% for the ERP implementation project',
      organizationId: org.id,
      projectId: erp.id,
      isActive: true,
    },
  })

  await prisma.commissionRule.create({
    data: {
      commissionPlanId: erpProjectPlan.id,
      ruleType: CommissionRuleType.PERCENTAGE,
      percentage: 13.0,
      scope: 'GLOBAL',
      priority: 'PROJECT_SPECIFIC',
    },
  })

  // Sales Transactions
  await prisma.salesTransaction.createMany({
    data: [
      {
        amount: 120000,
        projectId: erp.id,
        clientId: globalTech.id,
        userId: salesUser1.id,
        organizationId: org.id,
        transactionType: 'SALE',
        transactionDate: new Date('2025-02-10'),
        description: 'ERP implementation — Phase 1 contract',
        invoiceNumber: 'INV-2025-001',
      },
      {
        amount: 45000,
        projectId: campaignPortal.id,
        clientId: brightMedia.id,
        userId: salesUser1.id,
        organizationId: org.id,
        transactionType: 'SALE',
        transactionDate: new Date('2025-03-15'),
        description: 'Campaign portal — design & dev sprint 1',
        invoiceNumber: 'INV-2025-002',
      },
      {
        amount: 28500,
        projectId: inventorySystem.id,
        clientId: northstarRetail.id,
        userId: salesUser2.id,
        organizationId: org.id,
        transactionType: 'SALE',
        transactionDate: new Date('2025-03-28'),
        description: 'Inventory system — discovery & architecture',
        invoiceNumber: 'INV-2025-003',
      },
      {
        amount: 9800,
        projectId: mvp.id,
        clientId: launchpadStartup.id,
        userId: salesUser2.id,
        organizationId: org.id,
        transactionType: 'SALE',
        transactionDate: new Date('2025-04-05'),
        description: 'MVP — initial sprint package',
        invoiceNumber: 'INV-2025-004',
      },
      {
        amount: 62000,
        projectId: erp.id,
        clientId: globalTech.id,
        userId: salesUser1.id,
        organizationId: org.id,
        transactionType: 'SALE',
        transactionDate: new Date('2025-04-20'),
        description: 'ERP implementation — Phase 2 contract',
        invoiceNumber: 'INV-2025-005',
      },
    ],
  })

  console.log('✅ Demo organization created successfully!')
  console.log(`
🎭 Demo Summary:
- Organization: ${org.name} (slug: demo)
- Users: 3 (1 admin, 2 salespeople) — no Clerk login required
- Clients: 5
- Projects: 5
- Commission Plans: 4
- Sales Transactions: 5

To enter demo mode, visit /api/demo-login or click "View Demo" on the sign-in page.
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
