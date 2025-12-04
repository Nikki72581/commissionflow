// scripts/fix-commission-plans.ts
// Automatically fix common commission plan issues

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Commission Plans...\n')

  const orgs = await prisma.organization.findMany({
    include: {
      commissionPlans: {
        include: {
          rules: true
        }
      }
    }
  })

  for (const org of orgs) {
    console.log(`📋 Organization: ${org.name}\n`)

    if (org.commissionPlans.length === 0) {
      console.log('   ❌ No plans found. Creating a default plan...\n')
      
      const newPlan = await prisma.commissionPlan.create({
        data: {
          name: 'Standard Sales Commission',
          description: 'Auto-generated org-wide commission plan',
          organizationId: org.id,
          isActive: true,
        }
      })

      await prisma.commissionRule.create({
        data: {
          commissionPlanId: newPlan.id,
          ruleType: 'PERCENTAGE',
          percentage: 10,
          description: '10% commission on all sales',
        }
      })

      console.log('   ✅ Created default commission plan with 10% rule\n')
      continue
    }

    // Fix 1: Activate all inactive plans
    const inactivePlans = org.commissionPlans.filter(p => !p.isActive)
    if (inactivePlans.length > 0) {
      console.log(`   🔧 Activating ${inactivePlans.length} inactive plan(s)...`)
      
      for (const plan of inactivePlans) {
        await prisma.commissionPlan.update({
          where: { id: plan.id },
          data: { isActive: true }
        })
        console.log(`      ✅ Activated: "${plan.name}"`)
      }
      console.log()
    }

    // Fix 2: Add rules to plans without rules
    const plansWithoutRules = org.commissionPlans.filter(p => p.rules.length === 0)
    if (plansWithoutRules.length > 0) {
      console.log(`   🔧 Adding rules to ${plansWithoutRules.length} plan(s) without rules...`)
      
      for (const plan of plansWithoutRules) {
        await prisma.commissionRule.create({
          data: {
            commissionPlanId: plan.id,
            ruleType: 'PERCENTAGE',
            percentage: 10,
            description: 'Auto-generated 10% rule',
          }
        })
        console.log(`      ✅ Added 10% rule to: "${plan.name}"`)
      }
      console.log()
    }

    // Ensure at least one org-wide plan exists
    const orgWidePlans = org.commissionPlans.filter(p => !p.projectId)
    if (orgWidePlans.length === 0) {
      console.log('   🔧 Creating org-wide fallback plan...')
      
      const fallbackPlan = await prisma.commissionPlan.create({
        data: {
          name: 'Org-Wide Fallback Plan',
          description: 'Used for projects without specific plans',
          organizationId: org.id,
          isActive: true,
        }
      })

      await prisma.commissionRule.create({
        data: {
          commissionPlanId: fallbackPlan.id,
          ruleType: 'PERCENTAGE',
          percentage: 10,
          description: '10% commission',
        }
      })

      console.log('      ✅ Created org-wide fallback plan with 10% rule\n')
    }

    console.log('   ✅ All fixes applied!\n')
  }

  // Verify everything is good now
  console.log('=' .repeat(70))
  console.log('\n🔍 Verification:\n')

  for (const org of orgs) {
    const plans = await prisma.commissionPlan.findMany({
      where: { organizationId: org.id },
      include: { rules: true }
    })

    const activePlans = plans.filter(p => p.isActive)
    const plansWithRules = plans.filter(p => p.rules.length > 0)
    const usablePlans = plans.filter(p => p.isActive && p.rules.length > 0)
    const orgWidePlans = plans.filter(p => !p.projectId && p.isActive && p.rules.length > 0)

    console.log(`📋 ${org.name}:`)
    console.log(`   Total plans: ${plans.length}`)
    console.log(`   Active plans: ${activePlans.length}`)
    console.log(`   Plans with rules: ${plansWithRules.length}`)
    console.log(`   Usable plans (active + rules): ${usablePlans.length}`)
    console.log(`   Org-wide usable plans: ${orgWidePlans.length}`)

    if (usablePlans.length === 0) {
      console.log(`   ❌ Still have issues! Please check manually.`)
    } else if (orgWidePlans.length === 0) {
      console.log(`   ⚠️  No org-wide plans - project-specific plans only`)
    } else {
      console.log(`   ✅ Ready to generate sales!`)
    }
    console.log()
  }

  console.log('🎉 Done! Try generating sales now.\n')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
