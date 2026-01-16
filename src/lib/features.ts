// lib/features.ts
import { auth } from '@clerk/nextjs/server'

export type Feature = 'invite_members' | 'erp_integration' | 'advanced_reporting' | 'api_access'

/**
 * Check if the current organization has access to a feature.
 * Uses Clerk's feature-based access control.
 */
export async function hasFeature(feature: Feature): Promise<boolean> {
  const { has, orgId } = await auth()

  // No org = no premium features
  if (!orgId) {
    return false
  }

  // Check if the organization has the feature via Clerk's billing/subscription
  return has?.({ feature }) ?? false
}

/**
 * Check if user can invite members (org exists + has feature)
 */
export async function canInviteMembers(): Promise<boolean> {
  const { orgId } = await auth()

  if (!orgId) {
    return false // Must have an org first
  }

  return hasFeature('invite_members')
}

/**
 * Check if user has ERP integration access
 */
export async function canAccessERP(): Promise<boolean> {
  return hasFeature('erp_integration')
}

/**
 * Check if user has advanced reporting access
 */
export async function canAccessAdvancedReporting(): Promise<boolean> {
  return hasFeature('advanced_reporting')
}

/**
 * Check if user has API access
 */
export async function canAccessAPI(): Promise<boolean> {
  return hasFeature('api_access')
}

/**
 * Get all features the current organization has access to
 */
export async function getOrgFeatures(): Promise<Feature[]> {
  const features: Feature[] = []
  const allFeatures: Feature[] = ['invite_members', 'erp_integration', 'advanced_reporting', 'api_access']

  for (const feature of allFeatures) {
    if (await hasFeature(feature)) {
      features.push(feature)
    }
  }

  return features
}

/**
 * Feature metadata for display purposes
 */
export const featureInfo: Record<Feature, { name: string; description: string }> = {
  invite_members: {
    name: 'Team Invitations',
    description: 'Invite team members and give salespeople visibility into their commissions.',
  },
  erp_integration: {
    name: 'ERP Integration',
    description: 'Connect to Acumatica, Sage, Dynamics, and other ERP systems.',
  },
  advanced_reporting: {
    name: 'Advanced Reporting',
    description: 'Access advanced analytics and reporting dashboards.',
  },
  api_access: {
    name: 'API Access',
    description: 'Generate API keys to integrate with external systems.',
  },
}
