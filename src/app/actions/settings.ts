'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  updateUserProfileSchema,
  updateNotificationPreferencesSchema,
  type UpdateUserProfileInput,
  type UpdateNotificationPreferencesInput
} from '@/lib/validations/user'

/**
 * Get current user for settings
 */
async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

/**
 * Update user profile information
 */
export async function updateUserProfile(data: UpdateUserProfileInput) {
  try {
    const user = await getCurrentUser()
    const validatedData = updateUserProfileSchema.parse(data)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    // Create audit log for profile update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'settings_updated',
        entityType: 'user',
        entityId: user.id,
        description: `Updated profile: ${Object.keys(validatedData).join(', ')}`,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
}

/**
 * Get current user profile for display
 */
export async function getUserProfile() {
  try {
    const user = await getCurrentUser()

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        emailNotifications: user.emailNotifications,
        salesAlerts: user.salesAlerts,
        commissionAlerts: user.commissionAlerts,
        weeklyReports: user.weeklyReports,
      },
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    }
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(data: UpdateNotificationPreferencesInput) {
  try {
    const user = await getCurrentUser()
    const validatedData = updateNotificationPreferencesSchema.parse(data)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    // Create audit log for preferences update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'settings_updated',
        entityType: 'user',
        entityId: user.id,
        description: `Updated notification preferences: ${Object.keys(validatedData).join(', ')}`,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedUser,
      message: 'Notification preferences updated successfully',
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preferences',
    }
  }
}
