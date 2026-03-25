import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, DEMO_ORG_SLUG } from '@/lib/demo'

export async function GET(request: NextRequest) {
  const demoOrg = await db.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
  })

  if (!demoOrg) {
    return NextResponse.json(
      { error: 'Demo environment is not set up. Run: npm run db:seed:demo' },
      { status: 503 }
    )
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.set(DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return response
}
