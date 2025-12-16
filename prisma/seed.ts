// prisma/seed.ts
import { PrismaClient, UserRole, PlanTier, CommissionStatus, PayoutStatus, CommissionRuleType } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Helper function to generate random date within range
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.commissionCalculation.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.salesTransaction.deleteMany()
  await prisma.commissionRule.deleteMany()
  await prisma.commissionPlan.deleteMany()
  await prisma.project.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // Create Organizations
  console.log('🏢 Creating organizations...')
  const organizations = []

  const orgData = [
    { name: 'TechFlow Solutions', slug: 'techflow', tier: PlanTier.ENTERPRISE },
    { name: 'Growth Marketing Co', slug: 'growthmarketing', tier: PlanTier.PROFESSIONAL },
    { name: 'Startup Innovations', slug: 'startup-innovations', tier: PlanTier.GROWTH },
  ]

  for (const data of orgData) {
    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        planTier: data.tier,
      },
    })
    organizations.push(org)
  }

  console.log(`✅ Created ${organizations.length} organizations`)

  // For each organization, create users, clients, projects, etc.
  for (const org of organizations) {
    console.log(`\n📦 Populating ${org.name}...`)

    // Create Admin Users
    console.log('  👤 Creating admin users...')
    const admins = []
    const adminNames = [
      { first: 'Sarah', last: 'Johnson', email: 'sarah.johnson' },
      { first: 'Michael', last: 'Chen', email: 'michael.chen' },
    ]

    for (const admin of adminNames) {
      const user = await prisma.user.create({
        data: {
          clerkId: `${org.slug}_admin_${admin.first.toLowerCase()}`,
          email: `${admin.email}@${org.slug}.com`,
          firstName: admin.first,
          lastName: admin.last,
          role: UserRole.ADMIN,
          organizationId: org.id,
        },
      })
      admins.push(user)
    }

    // Create Salesperson Users
    console.log('  👥 Creating salesperson users...')
    const salespeople = []
    const salespersonCount = org.planTier === PlanTier.ENTERPRISE ? 12 : 
                            org.planTier === PlanTier.PROFESSIONAL ? 8 : 5

    const firstNames = ['Emma', 'James', 'Olivia', 'William', 'Sophia', 'Liam', 'Ava', 'Noah', 'Isabella', 'Mason', 'Mia', 'Ethan']
    const lastNames = ['Davis', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia']

    for (let i = 0; i < salespersonCount; i++) {
      const firstName = firstNames[i % firstNames.length]
      const lastName = lastNames[i % lastNames.length]
      const user = await prisma.user.create({
        data: {
          clerkId: `${org.slug}_sales_${i + 1}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 11 ? i : ''}@${org.slug}.com`,
          firstName,
          lastName,
          role: UserRole.SALESPERSON,
          organizationId: org.id,
        },
      })
      salespeople.push(user)
    }

    // Create Clients
    console.log('  🏢 Creating clients...')
    const clients = []
    const clientCount = Math.floor(salespersonCount * 2.5)

    for (let i = 0; i < clientCount; i++) {
      const client = await prisma.client.create({
        data: {
          name: faker.company.name(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`,
          notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
          organizationId: org.id,
        },
      })
      clients.push(client)
    }

    // Create Projects
    console.log('  📁 Creating projects...')
    const projects = []
    const projectTemplates = [
      { name: 'Website Redesign', desc: 'Complete website overhaul with modern design' },
      { name: 'Enterprise Software Implementation', desc: 'Deploy and configure enterprise solution' },
      { name: 'Cloud Migration', desc: 'Migrate infrastructure to cloud platform' },
      { name: 'Marketing Campaign', desc: 'Multi-channel marketing campaign' },
      { name: 'Mobile App Development', desc: 'Native mobile application development' },
      { name: 'SEO Optimization', desc: 'Search engine optimization project' },
      { name: 'Security Audit', desc: 'Comprehensive security assessment' },
      { name: 'Data Analytics Platform', desc: 'Business intelligence and analytics setup' },
    ]

    // Each client gets 1-3 projects
    for (const client of clients) {
      const numProjects = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numProjects; i++) {
        const template = randomItem(projectTemplates)
        const startDate = randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
        const endDate = Math.random() > 0.3 ? randomDate(startDate, new Date('2024-12-31')) : null
        const statuses = ['active', 'completed', 'cancelled']
        const status = endDate && endDate < new Date() ? randomItem(['completed', 'active']) : 'active'

        const project = await prisma.project.create({
          data: {
            name: `${client.name.split(' ')[0]} - ${template.name}`,
            description: template.desc,
            clientId: client.id,
            organizationId: org.id,
            startDate,
            endDate,
            status,
          },
        })
        projects.push(project)
      }
    }

    // Create Commission Plans
    console.log('  💼 Creating commission plans...')
    const commissionPlans = []

    // Organization-wide plans
    const orgWidePlans = [
      { name: 'Standard Sales Commission', desc: 'Base commission for all sales', isGlobal: true },
      { name: 'High-Value Deal Bonus', desc: 'Extra commission for deals over $50k', isGlobal: true },
    ]

    for (const planData of orgWidePlans) {
      const plan = await prisma.commissionPlan.create({
        data: {
          name: planData.name,
          description: planData.desc,
          organizationId: org.id,
          isActive: true,
        },
      })
      commissionPlans.push(plan)
    }

    // Project-specific plans (30% of projects get custom plans)
    for (const project of projects) {
      if (Math.random() < 0.3) {
        const plan = await prisma.commissionPlan.create({
          data: {
            name: `${project.name} - Custom Plan`,
            description: 'Project-specific commission structure',
            projectId: project.id,
            organizationId: org.id,
            isActive: true,
          },
        })
        commissionPlans.push(plan)
      }
    }

    // Create Commission Rules for each plan
    console.log('  📊 Creating commission rules...')
    for (const plan of commissionPlans) {
      // Each plan gets 1-3 rules
      const numRules = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < numRules; i++) {
        const ruleTypes = [CommissionRuleType.PERCENTAGE, CommissionRuleType.FLAT_AMOUNT, CommissionRuleType.TIERED]
        const ruleType = randomItem(ruleTypes)

        let ruleData: any = {
          commissionPlanId: plan.id,
          ruleType,
          description: '',
        }

        if (ruleType === CommissionRuleType.PERCENTAGE) {
          const percentage = 5 + Math.random() * 15 // 5-20%
          ruleData.percentage = Math.round(percentage * 100) / 100
          ruleData.description = `${ruleData.percentage}% of sale amount`
        } else if (ruleType === CommissionRuleType.FLAT_AMOUNT) {
          const amount = Math.round(500 + Math.random() * 2000) // $500-$2500
          ruleData.flatAmount = amount
          ruleData.description = `Flat $${amount} per sale`
        } else if (ruleType === CommissionRuleType.TIERED) {
          const threshold = Math.round(10000 + Math.random() * 40000) // $10k-$50k
          const basePercentage = 5 + Math.random() * 5 // 5-10%
          const tierPercentage = basePercentage + 5 + Math.random() * 5 // additional 5-10%
          ruleData.percentage = Math.round(basePercentage * 100) / 100
          ruleData.tierThreshold = threshold
          ruleData.tierPercentage = Math.round(tierPercentage * 100) / 100
          ruleData.description = `${ruleData.percentage}% up to $${threshold}, then ${ruleData.tierPercentage}%`
        }

        // Add caps and minimums occasionally
        if (Math.random() > 0.7) {
          ruleData.maxAmount = Math.round(5000 + Math.random() * 10000)
        }
        if (Math.random() > 0.8) {
          ruleData.minAmount = Math.round(100 + Math.random() * 400)
        }

        await prisma.commissionRule.create({ data: ruleData })
      }
    }

    // Create Sales Transactions and Commission Calculations
    console.log('  💰 Creating sales transactions and commissions...')
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-12-31')

    for (const salesperson of salespeople) {
      // Each salesperson gets 8-25 sales depending on org tier
      const numSales = org.planTier === PlanTier.ENTERPRISE ? Math.floor(Math.random() * 18) + 15 :
                      org.planTier === PlanTier.PROFESSIONAL ? Math.floor(Math.random() * 13) + 10 :
                      Math.floor(Math.random() * 8) + 5

      for (let i = 0; i < numSales; i++) {
        const project = randomItem(projects)
        const transactionDate = randomDate(startDate, endDate)
        const amount = Math.round(5000 + Math.random() * 95000) // $5k-$100k

        // Create sales transaction
        const transaction = await prisma.salesTransaction.create({
          data: {
            amount,
            projectId: project.id,
            userId: salesperson.id,
            organizationId: org.id,
            transactionDate,
            description: faker.commerce.productDescription(),
            invoiceNumber: `INV-${faker.string.alphanumeric(8).toUpperCase()}`,
          },
        })

        // Find applicable commission plan
        const applicablePlan = commissionPlans.find(p => p.projectId === project.id) || 
                              randomItem(commissionPlans.filter(p => !p.projectId))

        // Get the plan's rules to calculate commission
        const rules = await prisma.commissionRule.findMany({
          where: { commissionPlanId: applicablePlan.id },
        })

        let commissionAmount = 0
        for (const rule of rules) {
          if (rule.ruleType === CommissionRuleType.PERCENTAGE) {
            commissionAmount += amount * (rule.percentage! / 100)
          } else if (rule.ruleType === CommissionRuleType.FLAT_AMOUNT) {
            commissionAmount += rule.flatAmount!
          } else if (rule.ruleType === CommissionRuleType.TIERED) {
            if (amount <= rule.tierThreshold!) {
              commissionAmount += amount * (rule.percentage! / 100)
            } else {
              commissionAmount += rule.tierThreshold! * (rule.percentage! / 100)
              commissionAmount += (amount - rule.tierThreshold!) * (rule.tierPercentage! / 100)
            }
          }
        }

        // Apply min/max caps if any rule has them
        const maxCap = Math.max(...rules.filter(r => r.maxAmount).map(r => r.maxAmount!), 0)
        const minCap = Math.max(...rules.filter(r => r.minAmount).map(r => r.minAmount!), 0)
        if (maxCap > 0) commissionAmount = Math.min(commissionAmount, maxCap)
        if (minCap > 0) commissionAmount = Math.max(commissionAmount, minCap)

        commissionAmount = Math.round(commissionAmount * 100) / 100

        // Determine status based on transaction date
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
        await prisma.commissionCalculation.create({
          data: {
            salesTransactionId: transaction.id,
            commissionPlanId: applicablePlan.id,
            userId: salesperson.id,
            organizationId: org.id,
            amount: commissionAmount,
            status,
            calculatedAt: transactionDate,
            approvedAt,
            paidAt,
          },
        })
      }
    }

    // Create Payouts for PAID commissions
    console.log('  💸 Creating payouts...')
    const paidCommissions = await prisma.commissionCalculation.findMany({
      where: {
        organizationId: org.id,
        status: CommissionStatus.PAID,
      },
      include: {
        user: true,
      },
    })

    // Group paid commissions by user and month
    const commissionsByUserMonth = new Map<string, typeof paidCommissions>()
    paidCommissions.forEach(commission => {
      const monthKey = `${commission.userId}-${commission.paidAt!.getMonth()}-${commission.paidAt!.getFullYear()}`
      if (!commissionsByUserMonth.has(monthKey)) {
        commissionsByUserMonth.set(monthKey, [])
      }
      commissionsByUserMonth.get(monthKey)!.push(commission)
    })

    // Create a payout for each group
    for (const [key, commissions] of commissionsByUserMonth) {
      const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
      const user = commissions[0].user
      const payoutDate = commissions[0].paidAt!

      const payout = await prisma.payout.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          amount: totalAmount,
          status: PayoutStatus.COMPLETED,
          paymentMethod: randomItem(['Bank Transfer', 'PayPal', 'Check', 'Wire Transfer']),
          paymentDate: payoutDate,
          notes: `Monthly payout for ${payoutDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        },
      })

      // Link commissions to payout
      await prisma.commissionCalculation.updateMany({
        where: {
          id: { in: commissions.map(c => c.id) },
        },
        data: {
          payoutId: payout.id,
        },
      })
    }

    // Create some pending payouts
    const approvedCommissions = await prisma.commissionCalculation.findMany({
      where: {
        organizationId: org.id,
        status: CommissionStatus.APPROVED,
      },
      take: 10,
      include: {
        user: true,
      },
    })

    for (const commission of approvedCommissions) {
      await prisma.payout.create({
        data: {
          userId: commission.user.id,
          organizationId: org.id,
          amount: commission.amount,
          status: PayoutStatus.PENDING,
          paymentMethod: null,
          notes: 'Pending approval for payout',
        },
      })
    }

    // Create Audit Logs
    console.log('  📝 Creating audit logs...')
    const actions = [
      { action: 'commission_calculated', entityType: 'commission', description: 'Commission automatically calculated' },
      { action: 'commission_approved', entityType: 'commission', description: 'Commission approved by admin' },
      { action: 'commission_paid', entityType: 'commission', description: 'Commission marked as paid' },
      { action: 'payout_created', entityType: 'payout', description: 'Payout batch created' },
      { action: 'payout_completed', entityType: 'payout', description: 'Payout completed successfully' },
      { action: 'sale_created', entityType: 'sale', description: 'New sale recorded' },
      { action: 'plan_created', entityType: 'plan', description: 'Commission plan created' },
      { action: 'user_login', entityType: 'user', description: 'User logged in' },
    ]

    // Create 50-100 audit logs per org
    const numLogs = Math.floor(Math.random() * 50) + 50
    for (let i = 0; i < numLogs; i++) {
      const actionData = randomItem(actions)
      const user = Math.random() > 0.2 ? randomItem([...admins, ...salespeople]) : null
      const logDate = randomDate(startDate, new Date())

      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          userName: user ? `${user.firstName} ${user.lastName}` : 'System',
          userEmail: user?.email,
          action: actionData.action,
          entityType: actionData.entityType,
          entityId: faker.string.uuid(),
          description: actionData.description,
          organizationId: org.id,
          ipAddress: Math.random() > 0.5 ? faker.internet.ipv4() : null,
          userAgent: Math.random() > 0.5 ? faker.internet.userAgent() : null,
          createdAt: logDate,
          ...(Math.random() > 0.7 && {
            metadata: {
              amount: Math.random() * 10000,
              status: randomItem(['success', 'pending', 'failed']),
            },
          }),
        },
      })
    }

    console.log(`✅ Completed ${org.name}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Seed completed successfully!')
  console.log('='.repeat(60))
  
  // Print summary
  const stats = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.client.count(),
    prisma.project.count(),
    prisma.commissionPlan.count(),
    prisma.commissionRule.count(),
    prisma.salesTransaction.count(),
    prisma.commissionCalculation.count(),
    prisma.payout.count(),
    prisma.auditLog.count(),
  ])

  console.log('\n📊 Database Summary:')
  console.log(`   - Organizations: ${stats[0]}`)
  console.log(`   - Users: ${stats[1]}`)
  console.log(`   - Clients: ${stats[2]}`)
  console.log(`   - Projects: ${stats[3]}`)
  console.log(`   - Commission Plans: ${stats[4]}`)
  console.log(`   - Commission Rules: ${stats[5]}`)
  console.log(`   - Sales Transactions: ${stats[6]}`)
  console.log(`   - Commission Calculations: ${stats[7]}`)
  console.log(`   - Payouts: ${stats[8]}`)
  console.log(`   - Audit Logs: ${stats[9]}`)
  
  console.log('\n🔑 Demo Organizations:')
  const orgs = await prisma.organization.findMany({
    include: {
      users: {
        where: { role: UserRole.ADMIN },
        take: 1,
      },
    },
  })
  
  orgs.forEach(org => {
    console.log(`\n   ${org.name} (${org.planTier})`)
    console.log(`   Slug: ${org.slug}`)
    if (org.users[0]) {
      console.log(`   Admin: ${org.users[0].email}`)
      console.log(`   Clerk ID: ${org.users[0].clerkId}`)
    }
  })
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
