# Testing Demo Data Generation

## How to See Detailed Error Messages

### Option 1: Browser Console (Recommended)
1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Try generating sales
4. Look for console.error messages that show the full error details

### Option 2: Network Tab
1. Open Developer Tools (F12)
2. Go to the **Network** tab
3. Try generating sales
4. Click on the failed request (will be red, status 400 or 500)
5. Click the **Response** tab to see the full error message including stack trace

### Option 3: Vercel Logs
1. Go to your Vercel dashboard
2. Select your project
3. Click on "Functions" in the sidebar
4. Find the `/api/admin/demo-data/sales` function
5. Click on it to see the logs (console.log and console.error output)

## Common Issues and Solutions

### Issue: "No projects found"
**Solution:** Generate projects first before generating sales, OR disable `requireProjects` in your organization settings

### Issue: "No clients or projects found"
**Solution:** Generate clients first (at least 5-10 clients recommended)

### Issue: "No salespeople found"
**Solution:** Add at least one user with role='SALESPERSON' to your organization

### Issue: "No commission plans found"
**Solution:** Create at least one commission plan with rules

### Issue: TypeScript errors about clientId
**Solution:** Run `npx prisma generate` to regenerate the Prisma client

## Testing Checklist

Before generating sales, ensure you have:
- [ ] At least 1 salesperson in your organization
- [ ] At least 1 commission plan with rules
- [ ] Either:
  - [ ] At least 5 clients (if requireProjects is false)
  - [ ] At least 5 projects (if requireProjects is true)
  - [ ] Both clients and projects (recommended)

## Manual Testing Steps

1. First, generate clients:
   ```
   Click "Generate 10 Clients" button
   ```

2. Then, generate projects:
   ```
   Click "Generate 15 Projects" button
   ```

3. Finally, generate sales:
   ```
   Click "Generate 10 Sales" button
   ```

## Expected Behavior

The sales generation will now:
- Check if your organization requires projects
- If yes: only create sales with projects
- If no: create a mix of sales with projects (70%) and sales with just clients (30%)
- Show detailed error messages if something goes wrong
- Skip sales that can't be created and continue with the rest
