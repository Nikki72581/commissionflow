// lib/auth.ts
import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from './db';
import { redirect } from 'next/navigation';
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, DEMO_ORG_SLUG } from './demo';

export async function getCurrentUserWithOrg() {
  // Check for demo session first
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(DEMO_COOKIE_NAME);

  if (demoCookie?.value === DEMO_COOKIE_VALUE) {
    const demoOrg = await db.organization.findUnique({
      where: { slug: DEMO_ORG_SLUG },
    });
    if (demoOrg) {
      const demoUser = await db.user.findFirst({
        where: { organizationId: demoOrg.id, role: 'ADMIN' },
        include: { organization: true },
      });
      if (demoUser) return demoUser;
    }
    // Demo org not seeded — fall through to normal auth
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in');
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { organization: true },
  });

  // If user doesn't exist in our database, they need to complete onboarding
  if (!user) {
    redirect('/onboarding');
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUserWithOrg();
  
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return user;
}

export async function getClerkUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }

  return clerkUser;
}