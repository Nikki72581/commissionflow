'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { testConnection, listAvailableCompanies } from '@/lib/acumatica/auth';
import { encryptPasswordCredentials } from '@/lib/acumatica/encryption';
import { revalidatePath } from 'next/cache';
import type { AcumaticaCompany } from '@/lib/acumatica/types';

interface TestConnectionInput {
  instanceUrl: string;
  apiVersion: string;
  companyId: string;
  username: string;
  password: string;
}

interface TestConnectionResult {
  success: boolean;
  error?: string;
}

interface ListCompaniesInput {
  instanceUrl: string;
  apiVersion: string;
  username: string;
  password: string;
}

interface ListCompaniesResult {
  success: boolean;
  companies?: Array<{
    id: string;
    name: string;
  }>;
  error?: string;
}

/**
 * List available companies from Acumatica instance
 */
export async function listAcumaticaCompanies(
  input: ListCompaniesInput
): Promise<ListCompaniesResult> {
  console.log('[Server] listAcumaticaCompanies called');

  try {
    const { userId } = await auth();
    console.log('[Server] Auth userId:', userId ? 'authenticated' : 'not authenticated');

    if (!userId) {
      console.log('[Server] Returning unauthorized');
      return { success: false, error: 'Unauthorized' };
    }

    // Validate inputs
    console.log('[Server] Validating inputs:', {
      hasInstanceUrl: !!input.instanceUrl,
      hasApiVersion: !!input.apiVersion,
      hasUsername: !!input.username,
      hasPassword: !!input.password,
    });

    if (!input.instanceUrl || !input.apiVersion || !input.username || !input.password) {
      console.log('[Server] Validation failed - missing fields');
      return { success: false, error: 'Instance URL, API version, username, and password are required' };
    }

    // Ensure URL is valid HTTPS
    try {
      const url = new URL(input.instanceUrl);
      console.log('[Server] URL protocol:', url.protocol);
      if (url.protocol !== 'https:') {
        console.log('[Server] URL is not HTTPS');
        return { success: false, error: 'Instance URL must use HTTPS' };
      }
    } catch (urlError) {
      console.error('[Server] URL parsing error:', urlError);
      return { success: false, error: 'Invalid instance URL format' };
    }

    // List companies
    console.log('[Server] Calling listAvailableCompanies...');
    const result = await listAvailableCompanies(
      input.instanceUrl,
      input.apiVersion,
      input.username,
      input.password
    );

    console.log('[Server] List companies result:', JSON.stringify(result));

    if (!result.success || !result.companies) {
      return {
        success: false,
        error: result.error || 'Failed to retrieve companies',
      };
    }

    // Convert to plain serializable format
    const companies = result.companies.map((company) => ({
      id: company.CompanyID.value,
      name: company.CompanyName.value,
    }));

    console.log('[Server] Returning companies:', companies);

    return {
      success: true,
      companies,
    };
  } catch (error) {
    console.error('[Server] List companies error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('[Server] Returning error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Test connection to Acumatica without saving credentials
 */
export async function testAcumaticaConnection(
  input: TestConnectionInput
): Promise<TestConnectionResult> {
  console.log('[Server] testAcumaticaConnection called');

  try {
    const { userId } = await auth();
    console.log('[Server] Auth userId:', userId ? 'authenticated' : 'not authenticated');

    if (!userId) {
      console.log('[Server] Returning unauthorized');
      return { success: false, error: 'Unauthorized' };
    }

    // Validate inputs
    console.log('[Server] Validating inputs:', {
      hasInstanceUrl: !!input.instanceUrl,
      hasApiVersion: !!input.apiVersion,
      hasCompanyId: !!input.companyId,
      hasUsername: !!input.username,
      hasPassword: !!input.password,
    });

    if (!input.instanceUrl || !input.apiVersion || !input.companyId || !input.username || !input.password) {
      console.log('[Server] Validation failed - missing fields');
      return { success: false, error: 'All fields are required' };
    }

    // Ensure URL is valid HTTPS
    try {
      const url = new URL(input.instanceUrl);
      console.log('[Server] URL protocol:', url.protocol);
      if (url.protocol !== 'https:') {
        console.log('[Server] URL is not HTTPS');
        return { success: false, error: 'Instance URL must use HTTPS' };
      }
    } catch (urlError) {
      console.error('[Server] URL parsing error:', urlError);
      return { success: false, error: 'Invalid instance URL format' };
    }

    // Test the connection
    console.log('[Server] Calling testConnection...');
    const result = await testConnection(
      input.instanceUrl,
      input.apiVersion,
      input.companyId,
      input.username,
      input.password
    );

    console.log('[Server] Test connection result:', JSON.stringify(result));

    if (!result.success) {
      console.error('[Server] Connection test failed with error:', result.error);
      if (result.statusCode) {
        console.error('[Server] HTTP Status Code:', result.statusCode);
      }
    }

    // Ensure we return a plain serializable object
    const returnValue: TestConnectionResult = {
      success: result.success,
      error: result.error || undefined,
    };

    console.log('[Server] Returning:', JSON.stringify(returnValue));
    return returnValue;
  } catch (error) {
    console.error('[Server] Test connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('[Server] Returning error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

interface SaveConnectionInput {
  instanceUrl: string;
  apiVersion: string;
  companyId: string;
  username: string;
  password: string;
}

interface SaveConnectionResult {
  success: boolean;
  integrationId?: string;
  error?: string;
}

/**
 * Save Acumatica connection configuration
 */
export async function saveAcumaticaConnection(
  input: SaveConnectionInput
): Promise<SaveConnectionResult> {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    // Validate user is admin
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        organizationId: organization.id,
        role: 'ADMIN',
      },
    });

    if (!user) {
      return { success: false, error: 'Only admins can configure integrations' };
    }

    // Test connection first
    const testResult = await testConnection(
      input.instanceUrl,
      input.apiVersion,
      input.companyId,
      input.username,
      input.password
    );

    if (!testResult.success) {
      return {
        success: false,
        error: testResult.error || 'Connection test failed',
      };
    }

    // Encrypt credentials
    const encryptedCredentials = encryptPasswordCredentials(
      input.username,
      input.password
    );

    // Save or update integration
    const integration = await prisma.acumaticaIntegration.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        instanceUrl: input.instanceUrl.replace(/\/$/, ''), // Remove trailing slash
        apiVersion: input.apiVersion,
        companyId: input.companyId,
        encryptedCredentials,
        status: 'INACTIVE', // Not active until fully configured
        lastConnectionTest: new Date(),
        // Set default date range (last 30 days to now)
        invoiceStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        instanceUrl: input.instanceUrl.replace(/\/$/, ''),
        apiVersion: input.apiVersion,
        companyId: input.companyId,
        encryptedCredentials,
        lastConnectionTest: new Date(),
        connectionErrorMessage: null,
      },
    });

    revalidatePath('/settings/integrations/acumatica');

    return {
      success: true,
      integrationId: integration.id,
    };
  } catch (error) {
    console.error('Save connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save connection',
    };
  }
}

/**
 * Get current integration configuration
 */
export async function getAcumaticaIntegration() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return null;
    }

    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      return null;
    }

    const integration = await prisma.acumaticaIntegration.findUnique({
      where: { organizationId: organization.id },
    });

    return integration;
  } catch (error) {
    console.error('Get integration error:', error);
    return null;
  }
}
