// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { organizationName, planTier, role } = await req.json();

    // Check if user already has an organization
    const existingUser = await db.user.findUnique({
      where: { clerkId: user.id },
      include: { organization: true },
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already onboarded',
        organizationId: existingUser.organizationId 
      });
    }

    // Create organization slug from name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          planTier,
        },
      });

      // Create user
      const newUser = await tx.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          role,
          organizationId: organization.id,
        },
      });

      return { organization, user: newUser };
    });

    return NextResponse.json({ 
      success: true,
      organizationId: result.organization.id 
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { message: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}