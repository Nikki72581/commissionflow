# 🚀 Step 6 Phase 4: Audit Logs - Installation

## What Was Built

A comprehensive audit logging system that tracks all important actions in your commission system for compliance, debugging, and accountability.

### Features:
- **Complete Audit Trail** - Every important action logged
- **Who Did What When** - Track user, action, and timestamp
- **Filterable View** - Search by user, action, entity type
- **CSV Export** - Download audit logs for compliance
- **Pagination** - Handle thousands of entries efficiently
- **Activity Dashboard** - Recent activity overview
- **Entity History** - See all actions on specific items
- **IP Tracking** - Know where actions came from

---

## 📁 Files Created (6 files)

### Core System
1. **`lib/audit-log.ts`** - Audit log service and utilities
2. **`app/actions/audit-logs.ts`** - Server actions for viewing logs
3. **`app/dashboard/audit-logs/page.tsx`** - Page wrapper
4. **`app/dashboard/audit-logs/client-page.tsx`** - Audit log viewer UI

### Integration Examples
5. **`app/actions/bulk-payout-with-audit-log.ts`** - Example integration

### Documentation
6. **`AUDIT-LOG-SCHEMA.md`** - Database schema guide

---

## 📥 Installation (20 minutes)

### Step 1: Add Audit Log Schema to Prisma

Open `prisma/schema.prisma` and add the AuditLog model:

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  
  // Who performed the action
  userId         String?
  userName       String?
  userEmail      String?
  
  // What action was performed
  action         String
  entityType     String
  entityId       String?
  
  // Details
  description    String
  metadata       Json?
  
  // Context
  organizationId String
  ipAddress      String?
  userAgent      String?
  
  // Relations
  user           User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

**Also add these relations:**

```prisma
// In User model:
model User {
  // ... existing fields ...
  auditLogs      AuditLog[]
}

// In Organization model:
model Organization {
  // ... existing fields ...
  auditLogs      AuditLog[]
}
```

---

### Step 2: Run Migration

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_audit_logs

# Or push directly (Vercel Postgres)
npx prisma db push
```

**Verify migration succeeded:**
```bash
# Check migrations folder
ls prisma/migrations/

# Open Prisma Studio to verify
npx prisma studio
```

---

### Step 3: Download and Place Files

Download these files and place them in your project:

#### Core Files (4 files)

1. **[audit-log.ts](computer:///mnt/user-data/outputs/lib/audit-log.ts)** 
   → `src/lib/audit-log.ts`

2. **[audit-logs.ts](computer:///mnt/user-data/outputs/app/actions/audit-logs.ts)** 
   → `src/app/actions/audit-logs.ts`

3. **[page.tsx](computer:///mnt/user-data/outputs/app/dashboard/audit-logs/page.tsx)** 
   → `src/app/dashboard/audit-logs/page.tsx`

4. **[client-page.tsx](computer:///mnt/user-data/outputs/app/dashboard/audit-logs/client-page.tsx)** 
   → `src/app/dashboard/audit-logs/client-page.tsx`

#### Example Integration (1 file)

5. **[bulk-payout-with-audit-log.ts](computer:///mnt/user-data/outputs/app/actions/bulk-payout-with-audit-log.ts)**
   - Reference for integrating audit logs into your actions

---

### Step 4: Verify Directory Structure

```
src/
├── app/
│   ├── actions/
│   │   ├── audit-logs.ts                    ✓ NEW
│   │   └── bulk-payout.ts                   (update this)
│   └── dashboard/
│       └── audit-logs/
│           ├── page.tsx                     ✓ NEW
│           └── client-page.tsx              ✓ NEW
├── lib/
│   └── audit-log.ts                         ✓ NEW
└── prisma/
    └── schema.prisma                        ✓ UPDATED
```

---

### Step 5: Integrate Audit Logging

You need to add audit logging calls to your existing actions. Here's how:

#### Example 1: Commission Approval

**File:** `src/app/actions/commission-calculations.ts` (or wherever you approve commissions)

```typescript
import { logCommissionApproval } from '@/lib/audit-log'

async function approveCommission(calculationId: string) {
  // Get user info
  const currentUser = await getCurrentUserInfo()
  
  // Your existing approval logic
  const result = await prisma.commissionCalculation.update({
    where: { id: calculationId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    include: {
      user: true, // Include salesperson info
    },
  })

  // ADD THIS: Create audit log
  logCommissionApproval({
    commissionId: result.id,
    amount: result.amount,
    salespersonId: result.userId,
    salespersonName: `${result.user.firstName} ${result.user.lastName}`,
    approvedBy: {
      id: currentUser.id,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
    },
    organizationId: currentUser.organizationId,
  }).catch(console.error)  // Don't block on audit log failures

  return result
}
```

#### Example 2: Bulk Payout

See `bulk-payout-with-audit-log.ts` for complete example.

**Key changes:**
```typescript
import { logBulkPayout } from '@/lib/audit-log'

// After successful payout:
logBulkPayout({
  totalAmount,
  commissionsCount: calculations.length,
  salespeopleCount: uniqueSalespeople.size,
  calculationIds: input.calculationIds,
  processedBy: {
    id: currentUser.id,
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    email: currentUser.email,
  },
  organizationId: currentUser.organizationId,
}).catch(console.error)
```

#### Example 3: Commission Payment (Single)

```typescript
import { logCommissionPayment } from '@/lib/audit-log'

// After marking as paid:
logCommissionPayment({
  commissionId: calc.id,
  amount: calc.amount,
  salespersonId: calc.userId,
  salespersonName: `${calc.user.firstName} ${calc.user.lastName}`,
  paidBy: {
    id: currentUser.id,
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    email: currentUser.email,
  },
  organizationId: currentUser.organizationId,
}).catch(console.error)
```

---

### Step 6: Add Audit Logs to Navigation

**File:** Your dashboard navigation component

Add audit logs link:

```typescript
{
  title: 'Audit Logs',
  href: '/dashboard/audit-logs',
  icon: FileText,  // or Shield
}
```

---

### Step 7: Test Locally

```bash
# Restart dev server
npm run dev

# Visit audit logs page
http://localhost:3000/dashboard/audit-logs

# Perform actions and verify logs appear:
# 1. Approve a commission
# 2. Pay a commission
# 3. Process bulk payout
# 4. Check audit logs page
```

---

## 🎯 What Gets Logged

### Commission Actions

**commission_created**
- When: New commission calculated
- Who: System (automated)
- Data: Amount, salesperson, sale details

**commission_approved**
- When: Commission approved for payment
- Who: Admin/manager who approved
- Data: Amount, salesperson, old/new status

**commission_paid**
- When: Single commission marked as paid
- Who: Admin who processed payment
- Data: Amount, salesperson, payment date

**commission_rejected**
- When: Commission rejected
- Who: Admin who rejected
- Data: Amount, salesperson, reason

**bulk_payout_processed**
- When: Batch payout completed
- Who: Admin who processed
- Data: Total amount, count, salespeople affected

---

### Sale Actions

**sale_created**
- When: New sale transaction recorded
- Who: User who created
- Data: Amount, client, project

**sale_updated**
- When: Sale modified
- Who: User who updated
- Data: Changes made

**sale_deleted**
- When: Sale removed
- Who: User who deleted
- Data: Amount, reason

---

### Plan Actions

**plan_created**
- When: New commission plan created
- Who: User who created
- Data: Plan name, rules

**plan_updated**
- When: Plan modified
- Who: User who updated
- Data: Changes made

**plan_activated/deactivated**
- When: Plan enabled/disabled
- Who: User who changed
- Data: Plan name, status change

---

## 🎨 Audit Log Viewer Features

### Main View

**Display:**
- Timeline of all actions
- User who performed action
- Action type (with badge)
- Description (human-readable)
- Timestamp
- IP address
- Entity ID

**Icons by Entity Type:**
- 💰 Commission actions
- 🛒 Sale actions
- 📄 Plan actions
- 👤 User actions
- ⚙️ Settings actions

---

### Filtering

**Filter by:**
- User (dropdown of all users)
- Action type (dropdown of all actions)
- Entity type (commission, sale, plan, user)
- Date range (coming soon)

**Active Filters:**
- Shows current filters as badges
- One-click to clear all

---

### Pagination

- 50 entries per page (configurable)
- Previous/Next buttons
- Shows "Page X of Y"
- Shows total count

---

### Export

**CSV Export includes:**
- Timestamp
- User name and email
- Action type
- Entity type and ID
- Description
- IP address

**Filename:** `audit-logs-YYYY-MM-DD.csv`

---

## 🔧 Customization

### Add Custom Action Types

**File:** `lib/audit-log.ts`

```typescript
export type AuditAction =
  // ... existing actions ...
  | 'custom_action'  // ADD YOUR ACTION

// Then use it:
createAuditLog({
  action: 'custom_action',
  entityType: 'custom',
  description: 'Custom action performed',
  // ...
})
```

---

### Change Page Size

**File:** `app/dashboard/audit-logs/client-page.tsx`

```typescript
// Change default page size
const [filters, setFilters] = useState<AuditLogFilters>({
  // ...
  pageSize: 100,  // Change from 50 to 100
})
```

---

### Add Date Range Filter

**File:** `app/dashboard/audit-logs/client-page.tsx`

Add date pickers to filters:

```typescript
// In filters section:
<div className="space-y-2">
  <label className="text-sm font-medium">Start Date</label>
  <input
    type="date"
    onChange={(e) => updateFilter('startDate', new Date(e.target.value))}
  />
</div>

<div className="space-y-2">
  <label className="text-sm font-medium">End Date</label>
  <input
    type="date"
    onChange={(e) => updateFilter('endDate', new Date(e.target.value))}
  />
</div>
```

---

### Enable IP Address Tracking

To capture IP addresses, add to your server actions:

```typescript
import { headers } from 'next/headers'

async function getClientIp() {
  const headersList = headers()
  return headersList.get('x-forwarded-for') || 
         headersList.get('x-real-ip') || 
         'unknown'
}

// Then pass to audit log:
logCommissionApproval({
  // ...
  ipAddress: await getClientIp(),
})
```

---

## 📊 Audit Log Analytics

### View Statistics

```typescript
import { getAuditLogStats } from '@/app/actions/audit-logs'

const stats = await getAuditLogStats({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
})

console.log('Total logs:', stats.data.totalLogs)
console.log('Actions by type:', stats.data.actionCounts)
console.log('Most active users:', stats.data.userActivity)
```

---

### Query Entity History

```typescript
import { getEntityHistory } from '@/app/actions/audit-logs'

// Get all actions on a commission
const history = await getEntityHistory({
  entityType: 'commission',
  entityId: 'comm_xyz123',
  limit: 100,
})

// Shows: created → approved → paid
```

---

## 🧪 Testing

### Test 1: Commission Approval Logging

1. **Create** pending commission
2. **Approve** the commission
3. **Visit** /dashboard/audit-logs
4. **Verify** log entry shows:
   - ✅ "Commission Approved" action
   - ✅ Your name as approver
   - ✅ Amount and salesperson
   - ✅ Correct timestamp

---

### Test 2: Bulk Payout Logging

1. **Select** 3 approved commissions
2. **Process** bulk payout
3. **Check** audit logs
4. **Verify** entry shows:
   - ✅ "Bulk Payout" action
   - ✅ Total amount
   - ✅ Commissions count
   - ✅ Salespeople count

---

### Test 3: Filtering

1. **Apply** user filter (select yourself)
2. **Verify** only your actions shown
3. **Change** to action filter (Commission Approved)
4. **Verify** only approval actions shown
5. **Clear** filters
6. **Verify** all actions shown again

---

### Test 4: Export

1. **Filter** logs (optional)
2. **Click** Export CSV
3. **Verify** file downloads
4. **Open** CSV
5. **Check** all columns present
6. **Verify** data matches UI

---

### Test 5: Pagination

1. **Create** 60+ log entries (run many actions)
2. **Visit** audit logs
3. **Verify** shows 50 entries
4. **Click** Next
5. **Verify** shows remaining entries
6. **Click** Previous
7. **Verify** returns to first page

---

## 🐛 Troubleshooting

### Issue: Audit logs not appearing

**Check:**
1. Is audit log code being called?
2. Are errors being logged to console?
3. Is database migration applied?
4. Is organizationId correct?

**Debug:**
```typescript
// Add console logs
console.log('Creating audit log:', params)
const result = await createAuditLog(params)
console.log('Audit log result:', result)
```

---

### Issue: Migration fails

**Symptoms:**
- `npx prisma migrate dev` errors
- "Relation not found" errors

**Solutions:**

1. **Check schema syntax:**
```bash
npx prisma format
npx prisma validate
```

2. **Reset database (DEV ONLY!):**
```bash
npx prisma migrate reset
```

3. **Push without migration:**
```bash
npx prisma db push --skip-generate
npx prisma generate
```

---

### Issue: Filters not working

**Check:**
1. Filter state updating?
2. API call being made?
3. Network tab shows request?
4. Response has filtered data?

**Debug:**
```typescript
// Log filter changes
console.log('Filters changed:', filters)

// Log API response
const result = await getAuditLogsWithFilters(filters)
console.log('API result:', result)
```

---

### Issue: Export fails

**Check:**
1. Any logs to export?
2. Browser blocking download?
3. Console shows errors?

**Debug:**
```typescript
// Check export data
const result = await exportAuditLogsToCsv(filters)
console.log('Export data length:', result.data?.length)
```

---

### Issue: Slow performance

**With 10,000+ audit logs:**

**Solutions:**

1. **Add more indexes:**
```prisma
@@index([createdAt, organizationId])
@@index([userId, createdAt])
```

2. **Increase page size:**
```typescript
pageSize: 100  // Fetch more per request
```

3. **Add date range filter:**
Limit queries to recent data

4. **Archive old logs:**
Move old entries to separate table

---

## 🚀 Production Deployment

### Pre-Launch Checklist

- [ ] Schema added to Prisma
- [ ] Migration applied to production DB
- [ ] All files deployed
- [ ] Audit logging integrated in key actions
- [ ] Navigation link added
- [ ] Tested approval logging
- [ ] Tested bulk payout logging
- [ ] Tested filtering
- [ ] Tested export
- [ ] Tested pagination
- [ ] Performance reviewed

---

### Deploy Steps

```bash
# 1. Commit changes
git add .
git commit -m "feat: add audit logging system"

# 2. Push to main
git push origin main

# 3. Vercel auto-deploys

# 4. Run migration in production
# (Vercel runs migrations automatically if configured)
# Or manually: npx prisma migrate deploy
```

---

### Post-Deploy Verification

1. **Visit** production audit logs page
2. **Perform** test action
3. **Verify** log appears
4. **Test** filters
5. **Test** export
6. **Check** performance

---

## 📈 Maintenance

### Regular Tasks

**Weekly:**
- Review audit logs for anomalies
- Check disk usage (logs can grow large)
- Verify all actions being logged

**Monthly:**
- Export logs for compliance
- Review access patterns
- Check performance metrics

**Quarterly:**
- Archive old logs (optional)
- Review retention policy
- Update action types if needed

---

### Data Retention

**Consider:**
- Legal requirements (varies by jurisdiction)
- Compliance needs (e.g., SOC 2)
- Storage costs
- Query performance

**Example retention policy:**
- Keep all logs for 1 year
- Archive logs older than 1 year
- Delete logs older than 7 years

**Implementation:**
```typescript
// Archive old logs (run monthly)
const oneYearAgo = new Date()
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

// Move to archive table or export to S3
await prisma.auditLog.deleteMany({
  where: {
    createdAt: { lt: oneYearAgo },
  },
})
```

---

## ✅ Phase 4 Checklist

- [ ] Schema added to prisma/schema.prisma
- [ ] Migration run successfully
- [ ] Database verified in Prisma Studio
- [ ] 4 files downloaded and placed
- [ ] Audit logging integrated in bulk payout
- [ ] Audit logging integrated in approval flow
- [ ] Navigation link added
- [ ] Dev server restarted
- [ ] Visited /dashboard/audit-logs
- [ ] Performed test actions
- [ ] Logs appeared correctly
- [ ] Tested filters
- [ ] Tested export
- [ ] Tested pagination
- [ ] Ready for Phase 5!

---

**Audit Logging Complete!** 🎉

You now have a complete audit trail for compliance and debugging!

---

## 🔗 Next Phase

**Phase 5: Final Polish** - Loading states, error boundaries, mobile optimization

**Phase 6: Performance** - Database indexes, query optimization, caching

---

**Time to install:** ~20 minutes
**Value delivered:** High - Compliance, security, debugging, accountability
