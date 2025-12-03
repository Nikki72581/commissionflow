# 🔧 Fix: Missing Users Action

## The Problem

Vercel deployment failed with this error:

```
Type error: Cannot find module '@/app/actions/users' or its corresponding type declarations.

./src/app/dashboard/sales/page.tsx:17:26
import { getUsers } from '@/app/actions/users'
```

## Why This Happened

The sales page was trying to import `getUsers` from `@/app/actions/users`, but that file didn't exist. In my initial implementation, I skipped creating this file and used Prisma directly in the page, which worked locally but caused issues in the build.

## The Fix

I've created **two new files** for you:

### 1. Users Actions File (NEW)

**File:** `app/actions/users.ts`

This file provides server actions for managing users:
- `getUsers()` - Get all users in organization
- `getUser(userId)` - Get single user
- `getUsersByRole(role)` - Get users by role (ADMIN or SALESPERSON)

### 2. Updated Sales Page

**File:** `app/dashboard/sales/page.tsx`

Updated to properly use the `getUsers()` action instead of direct Prisma access.

---

## How to Apply

### Option 1: Copy Both Files (Recommended)

**Download these files:**

1. [**app/actions/users.ts**](computer:///mnt/user-data/outputs/app/actions/users.ts) - NEW file
2. [**app/dashboard/sales/page.tsx**](computer:///mnt/user-data/outputs/app/dashboard/sales/page.tsx) - Updated

**Copy to your project:**

```bash
# Copy the new users action
cp [downloaded]/app/actions/users.ts src/app/actions/

# Copy the updated sales page
cp [downloaded]/app/dashboard/sales/page.tsx src/app/dashboard/sales/
```

### Option 2: Create Files Manually

#### Step 1: Create `src/app/actions/users.ts`

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function getOrganizationId(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    throw new Error('User not associated with an organization')
  }

  return user.organizationId
}

export async function getUsers() {
  try {
    const organizationId = await getOrganizationId()

    const users = await prisma.user.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    })

    return {
      success: true,
      data: users,
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }
  }
}

export async function getUser(userId: string) {
  try {
    const organizationId = await getOrganizationId()

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    }
  }
}

export async function getUsersByRole(role: 'ADMIN' | 'SALESPERSON') {
  try {
    const organizationId = await getOrganizationId()

    const users = await prisma.user.findMany({
      where: {
        organizationId,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    })

    return {
      success: true,
      data: users,
    }
  } catch (error) {
    console.error('Error fetching users by role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }
  }
}
```

#### Step 2: Update `src/app/dashboard/sales/page.tsx`

Find the imports at the top and **make sure** `getUsers` is imported:

```typescript
import { getUsers } from '@/app/actions/users'  // ← Make sure this line exists
```

Then find the `SalesTable` function and update it to use the action:

**Change from:**
```typescript
// Get users from Prisma directly for now
const { prisma } = await import('@/lib/db')
const { auth } = await import('@clerk/nextjs/server')
const { userId } = await auth()

const currentUser = await prisma.user.findUnique({
  where: { clerkId: userId! },
  select: { organizationId: true },
})

const users = await prisma.user.findMany({
  where: { organizationId: currentUser?.organizationId },
  select: { id: true, firstName: true, lastName: true, email: true },
})
```

**Change to:**
```typescript
const [salesResult, projectsResult, usersResult] = await Promise.all([
  getSalesTransactions(),
  getProjects(),
  getUsers(),  // ← Use the action
])

// ... (keep the error handling)

const users = usersResult.success ? usersResult.data || [] : []
```

And at the bottom of the file in the `SalesPage` function:

**Change from:**
```typescript
const [projectsResult] = await Promise.all([getProjects()])
const projects = projectsResult.success ? projectsResult.data : []

// Get users from Prisma
const { prisma } = await import('@/lib/db')
// ... etc
```

**Change to:**
```typescript
const [projectsResult, usersResult] = await Promise.all([
  getProjects(),
  getUsers(),
])

const projects = projectsResult.success ? projectsResult.data : []
const users = usersResult.success ? usersResult.data : []
```

---

## After Applying the Fix

1. **Commit both files:**
   ```bash
   git add src/app/actions/users.ts
   git add src/app/dashboard/sales/page.tsx
   git commit -m "Add missing users action and update sales page"
   git push
   ```

2. **Vercel will auto-deploy**

3. **Build should succeed!** ✅

---

## What This Fix Does

### New Users Action

Provides a clean, reusable way to get users in your organization:

```typescript
// Get all users
const result = await getUsers()
if (result.success) {
  console.log(result.data) // Array of users
}

// Get single user
const user = await getUser(userId)

// Get only admins
const admins = await getUsersByRole('ADMIN')

// Get only salespeople
const salespeople = await getUsersByRole('SALESPERSON')
```

### Benefits

- ✅ **Organization-scoped** - Only sees users in your org
- ✅ **Reusable** - Can use in other pages/components
- ✅ **Type-safe** - Proper TypeScript types
- ✅ **Error handling** - Graceful error responses
- ✅ **Secure** - Server-side only

---

## Testing After Fix

1. Go to `/dashboard/sales`
2. Click "New Sale"
3. The "Salesperson" dropdown should populate with users
4. Everything should work as before

---

## Why Direct Prisma Access in Pages Is Bad

The old code accessed Prisma directly in the page component. This causes issues because:

1. **Server actions are cleaner** - Separation of concerns
2. **Reusability** - Can't reuse logic across components
3. **Build issues** - Prisma imports can cause build problems
4. **Type safety** - Harder to maintain types

**Always use server actions** instead of direct Prisma access in pages!

---

## Future Use

Now that you have `app/actions/users.ts`, you can use it anywhere:

```typescript
// In any server component or action
import { getUsers } from '@/app/actions/users'

const result = await getUsers()
```

This will be useful for:
- Assigning salespeople to projects
- User management pages
- Filtering by user
- Reports by salesperson

---

Apply these fixes and push to GitHub - Vercel will build successfully! 🚀
