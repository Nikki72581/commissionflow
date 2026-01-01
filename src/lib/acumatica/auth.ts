import { AcumaticaConnectionConfig } from './types';
import { decryptPasswordCredentials, decryptOAuthCredentials } from './encryption';
import { createAcumaticaClient } from './client';
import type { AcumaticaIntegration } from '@prisma/client';

/**
 * Create an Acumatica client from integration configuration
 */
export async function createAuthenticatedClient(
  integration: AcumaticaIntegration
): Promise<ReturnType<typeof createAcumaticaClient>> {
  // Decrypt credentials
  const credentials = decryptPasswordCredentials(integration.encryptedCredentials);

  const config: AcumaticaConnectionConfig = {
    instanceUrl: integration.instanceUrl,
    apiVersion: integration.apiVersion,
    companyId: integration.companyId,
    credentials: {
      type: 'password',
      username: credentials.username,
      password: credentials.password,
    },
  };

  const client = createAcumaticaClient(config);

  // Authenticate
  await client.authenticate();

  return client;
}

/**
 * Test connection with provided credentials without saving
 */
export async function testConnection(
  instanceUrl: string,
  apiVersion: string,
  companyId: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config: AcumaticaConnectionConfig = {
      instanceUrl,
      apiVersion,
      companyId,
      credentials: {
        type: 'password',
        username,
        password,
      },
    };

    const client = createAcumaticaClient(config);
    await client.testConnection();
    await client.logout();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
