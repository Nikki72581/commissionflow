'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * Get organization ID for current user
 */
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

/**
 * Get all users in the organization
 */
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

/**
 * Get a single user by ID
 */
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

/**
 * Get users by role
 */
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
