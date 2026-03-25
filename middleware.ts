// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from '@/lib/demo';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/demo-login',
  '/developers',
  '/api/reference',
  '/api/v1/openapi.json',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Check for demo session cookie
  const demoCookie = request.cookies.get(DEMO_COOKIE_NAME);
  const isDemo = demoCookie?.value === DEMO_COOKIE_VALUE;

  // Redirect authenticated/demo users from root to dashboard
  if ((userId || isDemo) && request.nextUrl.pathname === '/') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow public routes without authentication
  if (isPublicRoute(request)) {
    return;
  }

  // Allow demo users through all protected routes without Clerk auth
  if (isDemo) {
    return;
  }

  // Protect onboarding route but allow authenticated users
  if (isOnboardingRoute(request)) {
    await auth.protect();
    return;
  }

  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};