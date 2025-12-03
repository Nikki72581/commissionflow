# Quick Reference - Step 3

## File Structure Created

```
commissionflow/
│
├── lib/
│   ├── validations/
│   │   └── commission-plan.ts         # ✅ Step 3 - Plan & rule validation
│   └── commission-calculator.ts        # ✅ Step 3 - Calculation engine
│
├── app/
│   ├── actions/
│   │   └── commission-plans.ts        # ✅ Step 3 - Plan & rule CRUD
│   │
│   └── dashboard/
│       └── plans/
│           ├── page.tsx               # ✅ Step 3 - Plan list
│           └── [id]/
│               └── page.tsx           # ✅ Step 3 - Plan builder
│
└── components/
    └── plans/
        ├── plan-form-dialog.tsx       # ✅ Step 3 - Create/edit plan
        ├── rule-form-dialog.tsx       # ✅ Step 3 - Add/edit rule
        ├── commission-preview.tsx     # ✅ Step 3 - Calculator preview
        ├── plan-actions.tsx           # ✅ Step 3 - Plan actions menu
        └── rule-actions.tsx           # ✅ Step 3 - Rule actions menu
```

---

## Quick Start Commands

```bash
# Copy all Step 3 files
cp -r [downloaded-files]/* [your-project]/

# Generate Prisma (schema already exists)
npx prisma generate

# Start dev
npm run dev

# Visit
open http://localhost:3000/dashboard/plans
```

---

## Rule Types Cheat Sheet

### 1. Percentage
```typescript
{
  ruleType: 'PERCENTAGE',
  percentage: 10,              // 10% of sale
  minAmount: 100,              // Optional floor
  maxAmount: 5000              // Optional cap
}
```
**Example:** $10,000 sale → $1,000 commission

### 2. Flat Amount
```typescript
{
  ruleType: 'FLAT_AMOUNT',
  flatAmount: 500             // Fixed $500
}
```
**Example:** Any sale → $500 commission

### 3. Tiered
```typescript
{
  ruleType: 'TIERED',
  percentage: 5,              // Base rate
  tierThreshold: 10000,       // Threshold
  tierPercentage: 7           // Rate above threshold
}
```
**Example:** $15,000 sale:
- First $10k → $500 (5%)
- Next $5k → $350 (7%)
- Total: $850

---

## Key Server Actions

```typescript
// Create plan
await createCommissionPlan({
  name: "Standard Sales",
  description: "10% of sales",
  projectId: "optional",
  isActive: true
})

// Add rule
await createCommissionRule({
  commissionPlanId: "plan-id",
  ruleType: "PERCENTAGE",
  percentage: 10
})

// Get all plans
const result = await getCommissionPlans()

// Get one plan with rules
const result = await getCommissionPlan(planId)

// Update plan
await updateCommissionPlan(planId, { isActive: false })

// Delete plan
await deleteCommissionPlan(planId)

// Delete rule
await deleteCommissionRule(ruleId)
```

---

## Calculation Functions

```typescript
import { 
  calculateCommission,
  previewCommission,
  formatRule 
} from '@/lib/commission-calculator'

// Calculate
const result = calculateCommission(saleAmount, rules)
// Returns: { finalAmount, appliedRules, ... }

// Preview (for UI)
const preview = previewCommission(saleAmount, rules)
// Returns: { saleAmount, totalCommission, rules }

// Format rule for display
const text = formatRule(rule)
// Returns: "10% of sale" or "$500 per sale"
```

---

## Component Examples

### Plan Form
```typescript
import { CommissionPlanFormDialog } from '@/components/plans/plan-form-dialog'

// New plan
<CommissionPlanFormDialog projects={projects} />

// Edit plan
<CommissionPlanFormDialog plan={plan} projects={projects} />
```

### Rule Form
```typescript
import { RuleFormDialog } from '@/components/plans/rule-form-dialog'

// New rule
<RuleFormDialog planId={planId} />

// Edit rule
<RuleFormDialog planId={planId} rule={rule} />
```

### Preview
```typescript
import { CommissionPreview } from '@/components/plans/commission-preview'

<CommissionPreview rules={plan.rules} />
```

---

## Common Patterns

### Creating a Complete Plan

```typescript
// 1. Create the plan
const planResult = await createCommissionPlan({
  name: "Enterprise Sales",
  isActive: true
})

const planId = planResult.data.id

// 2. Add base rule
await createCommissionRule({
  commissionPlanId: planId,
  ruleType: 'PERCENTAGE',
  percentage: 5
})

// 3. Add bonus rule
await createCommissionRule({
  commissionPlanId: planId,
  ruleType: 'FLAT_AMOUNT',
  flatAmount: 1000
})

// 4. Add accelerator
await createCommissionRule({
  commissionPlanId: planId,
  ruleType: 'TIERED',
  percentage: 5,
  tierThreshold: 100000,
  tierPercentage: 7
})
```

### Testing Calculations

```typescript
const testSales = [1000, 5000, 10000, 50000, 100000, 250000]

testSales.forEach(amount => {
  const result = calculateCommission(amount, rules)
  console.log(`$${amount} → $${result.finalAmount}`)
})
```

---

## Routes

After Step 3:
- `/dashboard/plans` - List all plans
- `/dashboard/plans/[id]` - Plan builder/detail

---

## Validation Rules

### Plan
- ✅ Name: 1-100 characters (required)
- ✅ Description: Optional
- ✅ ProjectId: Must exist in org
- ✅ isActive: Boolean

### Rule - PERCENTAGE
- ✅ percentage: 0-100 (required)
- ✅ minAmount/maxAmount: Optional, min < max

### Rule - FLAT_AMOUNT
- ✅ flatAmount: > 0 (required)
- ✅ minAmount/maxAmount: Optional, min < max

### Rule - TIERED
- ✅ percentage: 0-100 (required) - base rate
- ✅ tierThreshold: > 0 (required)
- ✅ tierPercentage: 0-100 (required)
- ✅ minAmount/maxAmount: Optional, min < max

---

## Common Issues

### "Invalid rule configuration"
→ Make sure all required fields for rule type are filled

### "Maximum must be greater than minimum"
→ Check min < max if both are set

### Preview shows $0
→ Verify rules are saved (not just in form)
→ Check sale amount is > 0

### Can't delete plan
→ Plans with calculations can't be deleted
→ Deactivate instead or delete calculations first

---

## What's Next?

**Step 4** will add:
- Sales transaction entry
- CSV import
- Automatic calculations
- Apply these plans to real sales!

---

## Quick Test Script

```typescript
// Create and test a plan
const plan = await createCommissionPlan({
  name: "Test Plan",
  isActive: true
})

await createCommissionRule({
  commissionPlanId: plan.data.id,
  ruleType: 'PERCENTAGE',
  percentage: 10
})

// Test calculation
const result = calculateCommission(10000, plan.data.rules)
console.log(result.finalAmount) // Should be 1000
```

---

Ready to test! 🚀
