'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { createApiKey, revokeApiKey } from '@/lib/api-key-service'
import { createAuditLog } from '@/lib/audit-log'

async function getOrganizationId(): Promise<{
  organizationId: string
  userId: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      organizationId: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user?.organizationId)
    throw new Error('User not associated with organization')
  if (user.role !== 'ADMIN') throw new Error('Only admins can manage API keys')

  return {
    organizationId: user.organizationId,
    userId: user.id,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }
}

export async function createApiKeyAction(data: {
  name: string
  scopes: string[]
  expiresAt?: Date
  rateLimit?: number
}) {
  try {
    const { organizationId, user } = await getOrganizationId()

    const apiKey = await createApiKey({
      ...data,
      organizationId,
      createdById: user.id,
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      action: 'api_key_created',
      entityType: 'settings',
      entityId: apiKey.id,
      description: `Created API key "${data.name}"`,
      metadata: {
        scopes: data.scopes,
        keyPrefix: apiKey.keyPrefix,
      },
      organizationId,
    })

    revalidatePath('/dashboard/settings/api-keys')

    return { success: true, data: apiKey }
  } catch (error) {
    console.error('Error creating API key:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create API key',
    }
  }
}

export async function getApiKeys() {
  try {
    const { organizationId } = await getOrganizationId()

    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: apiKeys }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch API keys',
    }
  }
}

export async function revokeApiKeyAction(keyId: string) {
  try {
    const { organizationId, user } = await getOrganizationId()

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, organizationId },
    })

    if (!apiKey) throw new Error('API key not found')

    await revokeApiKey(keyId, user.id)

    // Audit log
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      action: 'api_key_revoked',
      entityType: 'settings',
      entityId: keyId,
      description: `Revoked API key "${apiKey.name}"`,
      organizationId,
    })

    revalidatePath('/dashboard/settings/api-keys')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to revoke API key',
    }
  }
}
