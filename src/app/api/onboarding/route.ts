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

    const body = await req.json();
    const { organizationName, planTier, role } = body;

    if (!organizationName || !planTier || !role) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has an organization
    const existingUser = await db.user.findUnique({
      where: { clerkId: user.id },
      include: { organization: true },
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: true,
        message: 'User already onboarded',
        organizationId: existingUser.organizationId 
      });
    }

    // Create organization slug from name
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Make slug unique by checking if it exists
    let slug = baseSlug;
    let counter = 1;
    while (await db.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

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
          firstName: user.firstName || '',
          lastName: user.lastName || '',
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
    
    // Return more specific error info
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
    
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}