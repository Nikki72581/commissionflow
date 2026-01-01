'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { createAcumaticaClient } from '@/lib/acumatica/client';
import { decryptPasswordCredentials } from '@/lib/acumatica/encryption';
import { revalidatePath } from 'next/cache';

interface FetchSalespeopleResult {
  success: boolean;
  salespeople?: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
  error?: string;
}

/**
 * Fetch salespeople from Acumatica and auto-match with existing users
 */
export async function fetchAcumaticaSalespeople(): Promise<FetchSalespeopleResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user and organization from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return { success: false, error: 'Organization not found' };
    }

    const organization = user.organization;

    // Get integration
    const integration = await prisma.acumaticaIntegration.findUnique({
      where: { organizationId: organization.id },
    });

    if (!integration) {
      return { success: false, error: 'Integration not configured. Please complete Step 1 first.' };
    }

    // Decrypt credentials
    const credentials = decryptPasswordCredentials(integration.encryptedCredentials);

    // Create Acumatica client
    const client = createAcumaticaClient({
      instanceUrl: integration.instanceUrl,
      apiVersion: integration.apiVersion,
      companyId: integration.companyId,
      credentials: {
        type: 'password',
        username: credentials.username,
        password: credentials.password,
      },
    });

    // Authenticate and fetch salespeople
    await client.authenticate();
    const acumaticaSalespeople = await client.fetchSalespeople();
    await client.logout();

    // Get existing users in organization for auto-matching
    const users = await prisma.user.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Get existing mappings
    const existingMappings = await prisma.acumaticaSalespersonMapping.findMany({
      where: { integrationId: integration.id },
    });

    const existingMappingsMap = new Map(
      existingMappings.map((m) => [m.acumaticaSalespersonId, m])
    );

    // Create or update mappings with auto-matching
    for (const salesperson of acumaticaSalespeople) {
      const salespersonId = salesperson.SalespersonID.value;
      const salespersonName = salesperson.Name.value;
      const salespersonEmail = salesperson.Email.value;

      const existingMapping = existingMappingsMap.get(salespersonId);

      // Auto-match logic
      let matchedUserId: string | null = null;
      let matchType: 'AUTO_EMAIL' | 'AUTO_NAME' | null = null;
      let status: 'PENDING' | 'MATCHED' = 'PENDING';

      // First, try email match (most reliable)
      if (salespersonEmail) {
        const emailMatch = users.find(
          (u) => u.email.toLowerCase() === salespersonEmail.toLowerCase()
        );
        if (emailMatch) {
          matchedUserId = emailMatch.id;
          matchType = 'AUTO_EMAIL';
          status = 'MATCHED';
        }
      }

      // If no email match, try name match
      if (!matchedUserId && salespersonName) {
        const nameMatch = users.find((u) => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return fullName.toLowerCase() === salespersonName.toLowerCase();
        });
        if (nameMatch) {
          matchedUserId = nameMatch.id;
          matchType = 'AUTO_NAME';
          status = 'MATCHED';
        }
      }

      // Create or update mapping
      if (existingMapping) {
        // Only update if not manually configured
        if (existingMapping.matchType !== 'MANUAL' && existingMapping.matchType !== 'CREATED_NEW') {
          await prisma.acumaticaSalespersonMapping.update({
            where: { id: existingMapping.id },
            data: {
              acumaticaSalespersonName: salespersonName,
              acumaticaEmail: salespersonEmail,
              userId: matchedUserId,
              matchType,
              status,
            },
          });
        }
      } else {
        await prisma.acumaticaSalespersonMapping.create({
          data: {
            integrationId: integration.id,
            acumaticaSalespersonId: salespersonId,
            acumaticaSalespersonName: salespersonName,
            acumaticaEmail: salespersonEmail,
            userId: matchedUserId,
            matchType,
            status,
          },
        });
      }
    }

    // Convert to serializable format
    const salespeople = acumaticaSalespeople.map((sp) => ({
      id: sp.SalespersonID.value,
      name: sp.Name.value,
      email: sp.Email.value,
    }));

    return {
      success: true,
      salespeople,
    };
  } catch (error) {
    console.error('Fetch salespeople error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch salespeople',
    };
  }
}

interface SalespersonMapping {
  id: string;
  acumaticaSalespersonId: string;
  acumaticaSalespersonName: string;
  acumaticaEmail: string | null;
  status: string;
  matchType: string | null;
  userId: string | null;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface GetSalespersonMappingsResult {
  success: boolean;
  mappings?: SalespersonMapping[];
  availableUsers?: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  error?: string;
}

/**
 * Get current salesperson mappings
 */
export async function getSalespersonMappings(): Promise<GetSalespersonMappingsResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user and organization from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return { success: false, error: 'Organization not found' };
    }

    const organization = user.organization;

    const integration = await prisma.acumaticaIntegration.findUnique({
      where: { organizationId: organization.id },
    });

    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }

    const mappings = await prisma.acumaticaSalespersonMapping.findMany({
      where: { integrationId: integration.id },
      orderBy: { acumaticaSalespersonName: 'asc' },
    });

    const availableUsers = await prisma.user.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    // Create a map of users for quick lookup
    const usersMap = new Map(availableUsers.map((u) => [u.id, u]));

    return {
      success: true,
      mappings: mappings.map((m) => ({
        id: m.id,
        acumaticaSalespersonId: m.acumaticaSalespersonId,
        acumaticaSalespersonName: m.acumaticaSalespersonName,
        acumaticaEmail: m.acumaticaEmail,
        status: m.status,
        matchType: m.matchType,
        userId: m.userId,
        user: m.userId ? usersMap.get(m.userId) || null : null,
      })),
      availableUsers,
    };
  } catch (error) {
    console.error('Get mappings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mappings',
    };
  }
}

interface UpdateMappingInput {
  mappingId: string;
  userId: string | null;
  action: 'map' | 'ignore';
}

interface UpdateMappingResult {
  success: boolean;
  error?: string;
}

/**
 * Update a salesperson mapping
 */
export async function updateSalespersonMapping(
  input: UpdateMappingInput
): Promise<UpdateMappingResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user and organization from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return { success: false, error: 'Organization not found' };
    }

    // Verify user is admin
    if (user.role !== 'ADMIN') {
      return { success: false, error: 'Only admins can update mappings' };
    }

    const organization = user.organization;

    if (input.action === 'ignore') {
      await prisma.acumaticaSalespersonMapping.update({
        where: { id: input.mappingId },
        data: {
          status: 'IGNORED',
          userId: null,
          matchType: null,
        },
      });
    } else if (input.action === 'map' && input.userId) {
      await prisma.acumaticaSalespersonMapping.update({
        where: { id: input.mappingId },
        data: {
          status: 'MATCHED',
          userId: input.userId,
          matchType: 'MANUAL',
        },
      });
    } else {
      return { success: false, error: 'Invalid action or missing userId' };
    }

    revalidatePath('/dashboard/integrations/acumatica/setup/salespeople');

    return { success: true };
  } catch (error) {
    console.error('Update mapping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update mapping',
    };
  }
}

interface SaveMappingsResult {
  success: boolean;
  error?: string;
}

/**
 * Save all mappings and proceed to next step
 */
export async function saveSalespersonMappings(): Promise<SaveMappingsResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user and organization from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return { success: false, error: 'Organization not found' };
    }

    const organization = user.organization;

    const integration = await prisma.acumaticaIntegration.findUnique({
      where: { organizationId: organization.id },
    });

    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }

    // Check if all mappings are resolved (no PENDING status)
    const pendingMappings = await prisma.acumaticaSalespersonMapping.count({
      where: {
        integrationId: integration.id,
        status: 'PENDING',
      },
    });

    if (pendingMappings > 0) {
      return {
        success: false,
        error: `You have ${pendingMappings} pending salesperson mapping(s). Please map or ignore all salespeople before continuing.`,
      };
    }

    revalidatePath('/dashboard/integrations');

    return { success: true };
  } catch (error) {
    console.error('Save mappings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save mappings',
    };
  }
}
