# Step 3: Commission Plan Builder - In Progress

## What's Complete So Far ✅

### 1. Validation Schemas (`lib/validations/commission-plan.ts`)
- Commission plan validation (create/update)
- Commission rule validation with type-specific rules
- Smart validation that checks rule configuration based on type
- Min/max amount validation

### 2. Server Actions (`app/actions/commission-plans.ts`)
- **Plan CRUD:** create, read, update, delete commission plans
- **Rule CRUD:** create, update, delete rules within plans
- Organization scoping for security
- Relationship validation (plans→projects, rules→plans)
- Statistics endpoint

### 3. Calculation Engine (`lib/commission-calculator.ts`)
- Calculate commissions based on rules
- Support for all three rule types:
  - **PERCENTAGE:** Simple % of sale
  - **FLAT_AMOUNT:** Fixed amount per sale
  - **TIERED:** Different rates at thresholds
- Min/max cap enforcement
- Preview functionality
- Rule formatting utilities

## What's Next 🎯

### 4. UI Components (Coming Next)
- Commission plan form dialog
- Commission rule form
- Plan list table
- Plan detail/builder page
- Rule list with add/edit/delete
- Preview calculator component

### 5. Pages
- `/dashboard/plans` - List all plans
- `/dashboard/plans/[id]` - Plan builder/detail

## Files Created So Far

```
lib/
├── validations/
│   └── commission-plan.ts        ✅ Complete
├── commission-calculator.ts       ✅ Complete
app/actions/
└── commission-plans.ts            ✅ Complete
```

## How It Works

### Commission Rules Explained

#### 1. Percentage Rule
```typescript
{
  ruleType: 'PERCENTAGE',
  percentage: 10,
  minAmount: 100,
  maxAmount: 5000
}
```
**Example:** On a $10,000 sale → $1,000 commission (10%)

#### 2. Flat Amount Rule
```typescript
{
  ruleType: 'FLAT_AMOUNT',
  flatAmount: 500
}
```
**Example:** On any sale → $500 commission

#### 3. Tiered Rule
```typescript
{
  ruleType: 'TIERED',
  percentage: 5,        // Base rate
  tierThreshold: 10000,
  tierPercentage: 7     // Rate above threshold
}
```
**Example:** On a $15,000 sale:
- First $10,000 → $500 (5%)
- Remaining $5,000 → $350 (7%)
- **Total: $850**

### Multiple Rules Per Plan

A plan can have multiple rules that stack:

```typescript
Plan: "Enterprise Sales"
Rules:
1. Base: 5% of all sales
2. Bonus: $1,000 flat if sale > $50k
3. Accelerator: 10% on amount above $100k
```

## API Examples

### Create a Plan
```typescript
const result = await createCommissionPlan({
  name: "Standard Sales Commission",
  description: "10% on all sales",
  projectId: "project-123",
  isActive: true
})
```

### Add a Rule
```typescript
const result = await createCommissionRule({
  commissionPlanId: "plan-123",
  ruleType: "PERCENTAGE",
  percentage: 10,
  minAmount: 100
})
```

### Preview Calculation
```typescript
import { previewCommission } from '@/lib/commission-calculator'

const preview = previewCommission(
  15000, // Sale amount
  rules   // Array of rules
)
// Returns: { saleAmount, totalCommission, rules breakdown }
```

## Next Session

I'll continue with the UI components and pages. Ready to continue?
