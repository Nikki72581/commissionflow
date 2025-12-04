# 🚀 Step 6 Phase 3: Email Notifications - Installation

## What Was Built

A complete email notification system that automatically alerts salespeople when their commissions are approved or paid.

### Features:
- **Approval Notifications** - Email sent when commission approved
- **Payment Notifications** - Email sent when commission paid
- **Batch Notifications** - Summary email for bulk payouts
- **Professional Templates** - Beautiful HTML emails with branding
- **Resend Integration** - Reliable email delivery service
- **Async Sending** - Non-blocking, doesn't slow down app
- **Error Handling** - Graceful fallback if emails fail

---

## 📁 Files Created (6 files)

### Core Email System
1. **`lib/email.ts`** - Email configuration and sending utility
2. **`lib/email-templates.ts`** - Professional HTML email templates
3. **`app/actions/email-notifications.ts`** - Notification server actions

### Updated Files
4. **`app/actions/bulk-payout-with-notifications.ts`** - Bulk payout with emails

### Documentation
5. **`RESEND-SETUP.md`** - Resend account setup guide
6. **`INTEGRATION-GUIDE.md`** - Integration instructions

---

## 📥 Installation (15 minutes)

### Step 1: Install Resend Package

```bash
npm install resend
```

---

### Step 2: Create Resend Account

1. **Go to:** [https://resend.com](https://resend.com)
2. **Sign up** for free account
   - 100 emails/day free
   - 3,000 emails/month free
3. **Navigate to** API Keys section
4. **Create** new API key
5. **Copy** the key (starts with `re_`)

---

### Step 3: Configure Environment Variables

Add to `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
COMPANY_NAME=YourCompany
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
RESEND_REPLY_TO_EMAIL=support@yourdomain.com
```

**For Testing (No Domain Required):**
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

### Step 4: Add Environment Variables to Vercel

1. **Go to** Vercel Dashboard
2. **Select** your project
3. **Navigate to** Settings → Environment Variables
4. **Add** each variable:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `COMPANY_NAME`
   - `NEXT_PUBLIC_APP_URL`
5. **Save** and redeploy

---

### Step 5: Download and Place Files

Download these files and place them in your project:

#### New Files (3 files)

1. **[email.ts](computer:///mnt/user-data/outputs/lib/email.ts)** 
   → `src/lib/email.ts`

2. **[email-templates.ts](computer:///mnt/user-data/outputs/lib/email-templates.ts)** 
   → `src/lib/email-templates.ts`

3. **[email-notifications.ts](computer:///mnt/user-data/outputs/app/actions/email-notifications.ts)** 
   → `src/app/actions/email-notifications.ts`

#### Updated File (1 file)

4. **[bulk-payout-with-notifications.ts](computer:///mnt/user-data/outputs/app/actions/bulk-payout-with-notifications.ts)**
   
   **Option A:** Replace existing (recommended)
   ```bash
   # Backup current version
   cp src/app/actions/bulk-payout.ts src/app/actions/bulk-payout.backup.ts
   
   # Replace with new version
   cp bulk-payout-with-notifications.ts src/app/actions/bulk-payout.ts
   ```
   
   **Option B:** Keep both and manually merge changes

---

### Step 6: Integrate Notifications into Approval Flow

Find your commission approval function (likely in `commission-calculations.ts` or similar) and add notification:

```typescript
import { sendCommissionApprovedNotification } from '@/app/actions/email-notifications'

// After approving commission:
async function approveCommission(calculationId: string) {
  // Your existing approval logic
  const result = await prisma.commissionCalculation.update({
    where: { id: calculationId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  })

  // ADD THIS: Send notification (async, non-blocking)
  sendCommissionApprovedNotification(calculationId).catch((error) => {
    console.error('Failed to send approval notification:', error)
  })

  return result
}
```

---

### Step 7: Verify Directory Structure

```
src/
├── app/
│   └── actions/
│       ├── email-notifications.ts        ✓ NEW
│       └── bulk-payout.ts                ✓ UPDATED (with notifications)
└── lib/
    ├── email.ts                          ✓ NEW
    └── email-templates.ts                ✓ NEW
```

---

### Step 8: Test Locally

```bash
# Start dev server
npm run dev

# Test by approving a commission or processing a payout
# Check server console for email logs
```

---

## 📧 Email Templates

### 1. Commission Approved Email

**Subject:** "Commission Approved - [Client Name]"

**Includes:**
- ✅ Commission amount (large, prominent)
- Status badge (APPROVED)
- Client and project name
- Sale amount and commission rate
- Sale date and approval date
- "View My Commissions" button

**Sent when:** Commission status changes to APPROVED

---

### 2. Commission Paid Email

**Subject:** "Commission Payment Processed - [Client Name]"

**Includes:**
- 💰 Payment amount (large, prominent)
- Status badge (PAID)
- Client and project name
- Sale amount
- Sale date and payment date
- "View Payment Details" button

**Sent when:** Single commission marked as PAID

---

### 3. Bulk Payout Summary Email

**Subject:** "Batch Payment Processed - [N] Commissions"

**Includes:**
- 💰 Total payment amount
- Number of commissions included
- List of all commissions (client/project/amount)
- Payment date
- "View All Payments" button

**Sent when:** Multiple commissions paid via bulk payout

---

## 🎨 Email Design

**Style:** Professional, clean, modern

**Colors:** 
- Primary: Purple gradient (#667eea → #764ba2)
- Success: Green
- Info: Blue
- Background: Light gray

**Features:**
- Mobile responsive
- Inline CSS (email-safe)
- Clear typography
- Prominent CTAs
- Company branding

---

## 🔧 How It Works

### Flow Diagram

```
Commission Approved
    ↓
saveCommission() updates status
    ↓
sendCommissionApprovedNotification(id)
    ↓
Fetch commission details from DB
    ↓
Generate HTML email from template
    ↓
Send via Resend API
    ↓
Email delivered to salesperson
```

### Async Processing

**Important:** Notifications are sent asynchronously (non-blocking)

```typescript
// This doesn't wait for email to send
sendCommissionApprovedNotification(id).catch(console.error)

// User sees success immediately
// Email sends in background
```

**Why?**
- ✅ Fast user experience
- ✅ Doesn't block critical operations
- ✅ Email failures don't break workflow

---

## 🧪 Testing

### Test 1: Approval Notification

1. **Create** a commission
2. **Approve** the commission
3. **Check** email inbox (use your personal email)
4. **Verify** email received
5. **Click** "View My Commissions" button
6. **Confirm** link works

### Test 2: Payment Notification

1. **Approve** a commission
2. **Mark** as PAID (or use bulk payout)
3. **Check** email inbox
4. **Verify** payment email received
5. **Review** email content

### Test 3: Bulk Payout Notifications

1. **Select** 2-3 approved commissions
2. **Process** bulk payout
3. **Check** each salesperson's email
4. **Verify** summary includes all their commissions
5. **Confirm** total amount correct

### Test 4: Error Handling

1. **Temporarily** invalidate API key
2. **Try** to send notification
3. **Verify** app doesn't crash
4. **Check** server logs show error
5. **Restore** valid API key

---

## 🎨 Customization

### Change Email Colors

**File:** `lib/email-templates.ts`

```css
/* Find this in getEmailWrapper() */

/* Current: Purple gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Option 1: Blue gradient */
background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);

/* Option 2: Green gradient */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Option 3: Red gradient */
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```

### Change Company Name

**File:** `.env.local`

```env
COMPANY_NAME=Your Company Inc
```

This updates:
- Email footer
- Email header
- All references to company

### Add Logo

**File:** `lib/email-templates.ts`

Add to `getEmailWrapper()` header:

```html
<div class="header">
  <img src="https://yourdomain.com/logo.png" alt="Logo" style="height: 40px; margin-bottom: 10px;">
  <h1>✅ Commission Approved!</h1>
</div>
```

### Change Button Style

**File:** `lib/email-templates.ts`

```css
.button {
  /* Current style */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Solid color */
  background: #667eea;
  
  /* Outline style */
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
}
```

### Add CC/BCC to Emails

**File:** `lib/email.ts`

```typescript
export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  cc?: string[]      // ADD THIS
  bcc?: string[]     // ADD THIS
}) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo || EMAIL_CONFIG.replyTo,
    cc: params.cc,     // ADD THIS
    bcc: params.bcc,   // ADD THIS
  })
  // ...
}
```

---

## 🐛 Troubleshooting

### Issue: No Emails Being Sent

**Symptoms:**
- Commissions approved but no email
- No errors in console
- Resend dashboard shows no sends

**Solutions:**

1. **Check API key:**
```bash
# Verify in .env.local
cat .env.local | grep RESEND_API_KEY
```

2. **Check key is valid:**
- Go to Resend dashboard
- Verify key hasn't been revoked
- Try regenerating key

3. **Check server logs:**
```bash
npm run dev
# Look for "Email sending error" in console
```

4. **Test manually:**
```typescript
// In a test file
import { areNotificationsEnabled } from '@/app/actions/email-notifications'
const status = await areNotificationsEnabled()
console.log(status)
```

---

### Issue: Emails Going to Spam

**Symptoms:**
- Emails sent but in spam folder
- Low deliverability

**Solutions:**

1. **Verify domain in Resend:**
   - Go to Resend → Domains
   - Add your domain
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification

2. **Use verified domain:**
```env
# Don't use gmail/yahoo/etc
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

3. **Check email content:**
   - Avoid spam trigger words
   - Include unsubscribe link (optional)
   - Use consistent "from" address

4. **Test with Mail Tester:**
   - Send test email to mail-tester.com
   - Review spam score
   - Fix issues identified

---

### Issue: Wrong Email Template

**Symptoms:**
- Approved email sent for payment
- Wrong amounts displayed
- Missing information

**Solutions:**

1. **Check function call:**
```typescript
// Make sure you're calling correct function
sendCommissionApprovedNotification(id)  // For approvals
sendCommissionPaidNotification(id)      // For payments
```

2. **Verify data:**
```typescript
// Log before sending
console.log('Sending approval email for:', calculationId)
```

3. **Check database status:**
```sql
-- Make sure status matches email type
SELECT id, status, approvedAt, paidAt FROM CommissionCalculation WHERE id = 'xxx';
```

---

### Issue: Slow Email Sending

**Symptoms:**
- Long delay before email received
- App feels slow during payout

**Solutions:**

1. **Check async implementation:**
```typescript
// CORRECT: Non-blocking
sendCommissionPaidNotification(id).catch(console.error)

// WRONG: Blocking
await sendCommissionPaidNotification(id)
```

2. **Check Resend API status:**
   - Visit Resend status page
   - Check for outages

3. **Review network:**
   - Check internet connection
   - Verify no firewall blocking

---

### Issue: Missing Environment Variables

**Symptoms:**
- Error: "RESEND_API_KEY is not defined"
- Emails not sending

**Solutions:**

1. **Check .env.local exists:**
```bash
ls -la .env.local
```

2. **Verify variables set:**
```bash
cat .env.local | grep RESEND
```

3. **Restart dev server:**
```bash
# Kill and restart
npm run dev
```

4. **Check Vercel (production):**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure all variables added
   - Redeploy after adding

---

## 🚀 Production Deployment

### Pre-Launch Checklist

- [ ] **Resend Account**
  - [ ] Account created and verified
  - [ ] API key generated
  - [ ] Billing set up (if needed)

- [ ] **Domain Setup**
  - [ ] Domain added to Resend
  - [ ] SPF record added to DNS
  - [ ] DKIM record added to DNS
  - [ ] DMARC record added to DNS (optional)
  - [ ] Domain verified in Resend

- [ ] **Environment Variables**
  - [ ] `RESEND_API_KEY` added to Vercel
  - [ ] `RESEND_FROM_EMAIL` using verified domain
  - [ ] `COMPANY_NAME` set correctly
  - [ ] `NEXT_PUBLIC_APP_URL` set to production URL

- [ ] **Testing**
  - [ ] Sent test approval notification
  - [ ] Sent test payment notification
  - [ ] Sent test bulk payout
  - [ ] Verified all links work
  - [ ] Checked spam folder
  - [ ] Tested on mobile

- [ ] **Templates**
  - [ ] Branding/colors updated
  - [ ] Company name correct
  - [ ] Logo added (if desired)
  - [ ] All copy reviewed
  - [ ] Links tested

- [ ] **Integration**
  - [ ] Approval notifications integrated
  - [ ] Payment notifications integrated
  - [ ] Bulk payout notifications working
  - [ ] Error handling tested

---

### Launch Steps

1. **Final Test in Staging:**
```bash
# Deploy to staging
vercel --env production

# Test all email flows
# Verify deliverability
```

2. **Deploy to Production:**
```bash
git add .
git commit -m "feat: add email notifications"
git push origin main
```

3. **Monitor Initial Sends:**
- Watch Resend dashboard
- Check server logs
- Verify emails delivered
- Monitor bounce rate

4. **Adjust If Needed:**
- Review spam reports
- Update templates if needed
- Adjust sending patterns

---

## 📊 Monitoring & Analytics

### Resend Dashboard

**Track:**
- Total emails sent
- Delivery rate
- Bounce rate
- Open rate (if tracking enabled)
- Click rate (if tracking enabled)

**Access:** [https://resend.com/emails](https://resend.com/emails)

### Server Logs

**What to log:**
```typescript
console.log('Email sent:', {
  type: 'commission_approved',
  recipient: email,
  calculationId: id,
  success: true
})
```

**Monitor:**
- Success rate
- Error patterns
- Response times

### Database Tracking (Optional)

Consider adding an `EmailLog` table:

```prisma
model EmailLog {
  id              String   @id @default(cuid())
  emailType       String   // 'commission_approved', 'commission_paid', etc
  recipient       String
  subject         String
  sentAt          DateTime @default(now())
  success         Boolean
  error           String?
  calculationId   String?
  
  @@index([sentAt])
  @@index([emailType])
}
```

---

## 📚 Additional Resources

- **[Resend Documentation](https://resend.com/docs)** - Official Resend docs
- **[RESEND-SETUP.md](computer:///mnt/user-data/outputs/RESEND-SETUP.md)** - Detailed setup guide
- **[INTEGRATION-GUIDE.md](computer:///mnt/user-data/outputs/INTEGRATION-GUIDE.md)** - Integration instructions

---

## ✅ Phase 3 Checklist

- [ ] Resend package installed
- [ ] Resend account created
- [ ] API key obtained
- [ ] Environment variables set (local)
- [ ] Environment variables set (Vercel)
- [ ] 3 new files added (email.ts, email-templates.ts, email-notifications.ts)
- [ ] bulk-payout.ts updated with notifications
- [ ] Approval flow integrated with notifications
- [ ] Dev server restarted
- [ ] Test approval notification sent
- [ ] Test payment notification sent
- [ ] Test bulk payout notifications sent
- [ ] All emails received successfully
- [ ] Links in emails working
- [ ] Templates look good on desktop
- [ ] Templates look good on mobile
- [ ] Ready for Phase 4!

---

**Email Notifications Complete!** 📧

Salespeople now get instant updates on their commissions!

---

## 🔗 Next Phase

**Phase 4: Audit Logs** - Track all important actions (approvals, payments, status changes)

---

**Time to install:** ~15 minutes
**Value delivered:** High - Automatic communication with sales team, transparency, reduces support inquiries
