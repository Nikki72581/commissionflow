import crypto from 'crypto'
import { prisma } from './db'

export interface CreateApiKeyParams {
  name: string
  organizationId: string
  createdById: string
  scopes: string[]
  expiresAt?: Date
  rateLimit?: number
  ipWhitelist?: string[]
}

export interface ApiKeyResult {
  id: string
  name: string
  key: string // Only returned once on creation
  keyPrefix: string
  scopes: string[]
  createdAt: Date
}

export interface ValidatedApiKey {
  id: string
  organizationId: string
  organization: {
    id: string
    name: string
    planTier: string
  }
  scopes: string[]
  rateLimit: number
  ipWhitelist: string[] | null
}

/**
 * Generate a secure API key
 * Format: cf_live_<random32chars> or cf_test_<random32chars>
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): {
  key: string
  keyHash: string
  keyPrefix: string
} {
  const randomBytes = crypto.randomBytes(24)
  const randomString = randomBytes.toString('base64url')
  const key = `cf_${environment}_${randomString}`

  // Hash the key for storage (using SHA-256)
  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  // Store first 12 chars for display
  const keyPrefix = key.substring(0, 12)

  return { key, keyHash, keyPrefix }
}

/**
 * Verify an API key matches stored hash
 */
export function verifyApiKey(key: string, storedHash: string): boolean {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(storedHash))
}

/**
 * Create a new API key
 */
export async function createApiKey(
  params: CreateApiKeyParams
): Promise<ApiKeyResult> {
  const { key, keyHash, keyPrefix } = generateApiKey('live')

  const apiKey = await prisma.apiKey.create({
    data: {
      name: params.name,
      key: keyHash,
      keyPrefix,
      organizationId: params.organizationId,
      createdById: params.createdById,
      scopes: params.scopes,
      expiresAt: params.expiresAt,
      rateLimit: params.rateLimit ?? 1000,
      ipWhitelist: params.ipWhitelist,
    },
  })

  return {
    id: apiKey.id,
    name: apiKey.name,
    key, // Return plain key only once
    keyPrefix: apiKey.keyPrefix,
    scopes: params.scopes,
    createdAt: apiKey.createdAt,
  }
}

/**
 * Validate API key and return associated data
 */
export async function validateApiKey(
  key: string
): Promise<ValidatedApiKey | null> {
  // Extract prefix for quick lookup
  const keyPrefix = key.substring(0, 12)

  // Find keys with matching prefix
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      keyPrefix,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      organization: {
        select: { id: true, name: true, planTier: true },
      },
    },
  })

  // Verify hash (constant-time comparison)
  for (const apiKey of apiKeys) {
    if (verifyApiKey(key, apiKey.key)) {
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })

      return {
        id: apiKey.id,
        organizationId: apiKey.organizationId,
        organization: apiKey.organization,
        scopes: apiKey.scopes as string[],
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist as string[] | null,
      }
    }
  }

  return null
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, revokedById: string) {
  return await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedById,
    },
  })
}

/**
 * Log API usage
 */
export async function logApiUsage(params: {
  apiKeyId: string
  organizationId: string
  endpoint: string
  method: string
  statusCode: number
  ipAddress?: string
  userAgent?: string
  duration?: number
  errorMessage?: string
}) {
  return await prisma.apiUsageLog.create({
    data: params,
  })
}
