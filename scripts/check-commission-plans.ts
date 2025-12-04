// scripts/check-commission-plans.ts
// Check your commission plans and make sure they're set up correctly

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Commission Plans...\n')

  // Get all organizations
  const orgs = await prisma.organization.findMany({
    include: {
      commissionPlans: {
        include: {
          rules: true,
          project: {
            select: { name: true }
          }
        }
      }
    }
  })

  if (orgs.length === 0) {
    console.log('❌ No organizations found!')
    return
  }

  for (const org of orgs) {
    console.log(`📋 Organization: ${org.name}`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Plans: ${org.commissionPlans.length}\n`)

    if (org.commissionPlans.length === 0) {
      console.log('   ⚠️  No commission plans found!')
      console.log('   💡 Create a plan with: npx tsx scripts/create-demo-commission-plan.ts\n')
      continue
    }

    // Analyze each plan
    const issues: string[] = []
    const orgWidePlans = org.commissionPlans.filter(p => !p.projectId)
    const projectPlans = org.commissionPlans.filter(p => p.projectId)
    const activePlans = org.commissionPlans.filter(p => p.isActive)
    const plansWithRules = org.commissionPlans.filter(p => p.rules.length > 0)

    console.log('   📊 Plan Breakdown:')
    console.log(`      - Total: ${org.commissionPlans.length}`)
    console.log(`      - Org-wide (not project-specific): ${orgWidePlans.length}`)
    console.log(`      - Project-specific: ${projectPlans.length}`)
    console.log(`      - Active: ${activePlans.length}`)
    console.log(`      - With rules: ${plansWithRules.length}\n`)

    // Check for issues
    if (activePlans.length === 0) {
      issues.push('❌ No active plans! At least one plan should be marked as active.')
    }
    if (plansWithRules.length === 0) {
      issues.push('❌ No plans have rules! Each plan needs at least one commission rule.')
    }
    if (orgWidePlans.length === 0) {
      issues.push('⚠️  No org-wide plans. Sales to projects without specific plans will fail.')
    }

    // List each plan
    console.log('   📋 Plan Details:')
    for (const plan of org.commissionPlans) {
      const scope = plan.projectId ? `Project: ${plan.project?.name}` : 'ORG-WIDE'
      const active = plan.isActive ? '✅ ACTIVE' : '⚠️  INACTIVE'
      const rules = plan.rules.length > 0 ? `${plan.rules.length} rule(s)` : '❌ NO RULES'
      
      console.log(`\n      "${plan.name}"`)
      console.log(`         Scope: ${scope}`)
      console.log(`         Status: ${active}`)
      console.log(`         Rules: ${rules}`)
      
      if (plan.rules.length > 0) {
        plan.rules.forEach(rule => {
          let ruleDesc = `- ${rule.ruleType}: `
          if (rule.ruleType === 'PERCENTAGE') {
            ruleDesc += `${rule.percentage}%`
          } else if (rule.ruleType === 'FLAT_AMOUNT') {
            ruleDesc += `$${rule.flatAmount}`
          } else if (rule.ruleType === 'TIERED') {
            ruleDesc += `${rule.percentage}% up to $${rule.tierThreshold}, then ${rule.tierPercentage}%`
          }
          console.log(`            ${ruleDesc}`)
        })
      }
    }

    // Show issues
    if (issues.length > 0) {
      console.log('\n   🚨 Issues Found:')
      issues.forEach(issue => console.log(`      ${issue}`))
    } else {
      console.log('\n   ✅ All checks passed! Plans look good.')
    }

    // Recommendations
    console.log('\n   💡 Recommendations:')
    if (orgWidePlans.filter(p => p.isActive && p.rules.length > 0).length === 0) {
      console.log('      1. Create at least one ACTIVE org-wide plan with rules')
      console.log('         This will be used as a fallback for all projects')
    }
    
    if (org.commissionPlans.some(p => !p.isActive)) {
      console.log('      2. Mark plans as active if you want them to be used:')
      org.commissionPlans.filter(p => !p.isActive).forEach(p => {
        console.log(`         - "${p.name}" (ID: ${p.id})`)
      })
    }

    if (org.commissionPlans.some(p => p.rules.length === 0)) {
      console.log('      3. Add rules to plans that have none:')
      org.commissionPlans.filter(p => p.rules.length === 0).forEach(p => {
        console.log(`         - "${p.name}" (ID: ${p.id})`)
      })
    }

    console.log('\n' + '='.repeat(70) + '\n')
  }

  // Offer to fix common issues
  console.log('🔧 Quick Fixes:\n')
  
  for (const org of orgs) {
    const inactivePlans = org.commissionPlans.filter(p => !p.isActive)
    
    if (inactivePlans.length > 0) {
      console.log(`Organization: ${org.name}`)
      console.log('Found inactive plans. To activate them, run:\n')
      
      for (const plan of inactivePlans) {
        console.log(`await prisma.commissionPlan.update({`)
        console.log(`  where: { id: '${plan.id}' },`)
        console.log(`  data: { isActive: true }`)
        console.log(`})\n`)
      }
    }
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
