// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const organizationName = String(body.organizationName || '').trim();
    const planTier = body.planTier;
    const role = body.role;
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();

    if (!organizationName || !planTier || !role || !firstName || !lastName) {
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
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(user.id, { firstName, lastName });
      } catch (error) {
        console.error('Failed to update Clerk user during onboarding:', error);
      }

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

    const clerk = await clerkClient();
    let clerkOrgId: string | null = null;
    let clerkOrgSlug = slug;

    try {
      const clerkOrg = await clerk.organizations.createOrganization({
        name: organizationName,
        slug,
        createdBy: user.id,
      });
      clerkOrgId = clerkOrg.id;
      if (clerkOrg.slug) {
        clerkOrgSlug = clerkOrg.slug;
      }
    } catch (error) {
      console.warn('Clerk org creation with provided slug failed, retrying without slug.');
      try {
        const clerkOrg = await clerk.organizations.createOrganization({
          name: organizationName,
          createdBy: user.id,
        });
        clerkOrgId = clerkOrg.id;
        if (clerkOrg.slug) {
          clerkOrgSlug = clerkOrg.slug;
        }
      } catch (retryError) {
        console.error('Failed to create Clerk organization during onboarding:', retryError);
        return NextResponse.json(
          { message: 'Failed to create organization' },
          { status: 500 }
        );
      }
    }

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create organization with Clerk org ID
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: clerkOrgSlug,
          planTier,
          clerkOrgId,
        },
      });

      // Create user
      const newUser = await tx.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstName,
          lastName,
          role,
          organizationId: organization.id,
        },
      });

      return { organization, user: newUser };
    }).catch(async (error) => {
      if (clerkOrgId) {
        try {
          await clerk.organizations.deleteOrganization(clerkOrgId);
        } catch (deleteError) {
          console.error('Failed to roll back Clerk organization:', deleteError);
        }
      }
      throw error;
    });

    try {
      await clerk.users.updateUser(user.id, { firstName, lastName });
    } catch (error) {
      console.error('Failed to update Clerk user during onboarding:', error);
    }

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
