import {
  AcumaticaConnectionConfig,
  AcumaticaInvoice,
  AcumaticaSalesperson,
  AcumaticaBranch,
  AcumaticaItemClass,
  AcumaticaCustomer,
  AcumaticaProject,
  AcumaticaCompany,
  AcumaticaErrorResponse,
  InvoiceQueryFilters,
} from './types';

export class AcumaticaAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: AcumaticaErrorResponse
  ) {
    super(message);
    this.name = 'AcumaticaAPIError';
  }
}

export class AcumaticaClient {
  private config: AcumaticaConnectionConfig;
  private baseUrl: string;
  private cookies: string[] = [];

  constructor(config: AcumaticaConnectionConfig) {
    this.config = config;
    // Ensure instanceUrl doesn't have trailing slash
    const instanceUrl = config.instanceUrl.replace(/\/$/, '');
    this.baseUrl = `${instanceUrl}/entity/Default/${config.apiVersion}`;
  }

  /**
   * Build full URL for an endpoint
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    let url = `${this.baseUrl}/${endpoint}`;

    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Authenticate with Acumatica using Resource Owner Password flow
   */
  async authenticate(): Promise<void> {
    if (this.config.credentials.type !== 'password') {
      throw new Error('Only password authentication is currently supported');
    }

    const { username, password } = this.config.credentials;
    const authUrl = `${this.config.instanceUrl}/identity/connect/token`;

    const formData = new URLSearchParams({
      grant_type: 'password',
      client_id: 'Default',
      username,
      password,
      scope: 'api',
    });

    // Also login to get session cookies
    const loginUrl = `${this.config.instanceUrl}/entity/auth/login`;

    try {
      // First, get the token (though we'll use cookie-based auth)
      console.log('[Acumatica Client] Attempting OAuth token authentication...');
      console.log('[Acumatica Client] Auth URL:', authUrl);
      console.log('[Acumatica Client] Username:', username);

      const tokenResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      console.log('[Acumatica Client] Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const error = (await tokenResponse.json()) as AcumaticaErrorResponse;
        console.error('[Acumatica Client] Token authentication failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: error.error,
          error_description: error.error_description,
          fullError: JSON.stringify(error),
        });
        throw new AcumaticaAPIError(
          `Token auth failed (${tokenResponse.status}): ${error.error_description || error.error || 'Authentication failed'}`,
          tokenResponse.status,
          error
        );
      }

      console.log('[Acumatica Client] Token obtained successfully');

      // Now login to get cookies
      console.log('[Acumatica Client] Attempting session login...');
      console.log('[Acumatica Client] Login URL:', loginUrl);
      console.log('[Acumatica Client] Company ID:', this.config.companyId);

      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          password: password,
          company: this.config.companyId,
        }),
      });

      console.log('[Acumatica Client] Login response status:', loginResponse.status);

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('[Acumatica Client] Session login failed:', {
          status: loginResponse.status,
          statusText: loginResponse.statusText,
          responseBody: errorText,
        });

        let error: AcumaticaErrorResponse;
        try {
          error = JSON.parse(errorText) as AcumaticaErrorResponse;
        } catch {
          error = { message: errorText || 'Login failed' };
        }

        throw new AcumaticaAPIError(
          `Session login failed (${loginResponse.status}): ${error.message || errorText || 'Login failed'}. Check: 1) Company ID is correct, 2) User has permissions, 3) User is not locked`,
          loginResponse.status,
          error
        );
      }

      console.log('[Acumatica Client] Session login successful');

      // Store cookies for subsequent requests
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        this.cookies = cookies.split(',').map((c) => c.split(';')[0].trim());
        console.log('[Acumatica Client] Cookies stored:', this.cookies.length);
      } else {
        console.warn('[Acumatica Client] No cookies received from login response');
      }
    } catch (error) {
      if (error instanceof AcumaticaAPIError) {
        console.error('[Acumatica Client] AcumaticaAPIError thrown:', error.message);
        throw error;
      }
      console.error('[Acumatica Client] Unexpected authentication error:', error);
      throw new AcumaticaAPIError(
        `Authentication error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Make an authenticated GET request to the API
   */
  private async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.cookies.length > 0) {
      headers['Cookie'] = this.cookies.join('; ');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as AcumaticaErrorResponse;
      throw new AcumaticaAPIError(
        error.message || error.exceptionMessage || `API request failed: ${response.statusText}`,
        response.status,
        error
      );
    }

    return response.json();
  }

  /**
   * Test the connection by fetching company info
   */
  async testConnection(): Promise<AcumaticaCompany[]> {
    await this.authenticate();
    return this.get<AcumaticaCompany[]>('Company', {
      $select: 'CompanyID,CompanyName',
    });
  }

  /**
   * Fetch all salespeople
   */
  async fetchSalespeople(): Promise<AcumaticaSalesperson[]> {
    return this.get<AcumaticaSalesperson[]>('Salesperson', {
      $select: 'SalespersonID,Name,Email',
    });
  }

  /**
   * Fetch all branches
   */
  async fetchBranches(): Promise<AcumaticaBranch[]> {
    return this.get<AcumaticaBranch[]>('Branch', {
      $select: 'BranchID,BranchName',
    });
  }

  /**
   * Fetch all item classes (for line filtering)
   */
  async fetchItemClasses(): Promise<AcumaticaItemClass[]> {
    return this.get<AcumaticaItemClass[]>('ItemClass', {
      $select: 'ClassID,Description',
    });
  }

  /**
   * Fetch customer by ID
   */
  async fetchCustomer(customerId: string): Promise<AcumaticaCustomer> {
    const results = await this.get<AcumaticaCustomer[]>(`Customer/${customerId}`, {
      $select: 'CustomerID,CustomerName,CustomerCD',
    });

    if (!results || results.length === 0) {
      throw new AcumaticaAPIError(`Customer ${customerId} not found`, 404);
    }

    return results[0];
  }

  /**
   * Fetch project by ID
   */
  async fetchProject(projectId: string): Promise<AcumaticaProject> {
    const results = await this.get<AcumaticaProject[]>(`Project/${projectId}`, {
      $select: 'ProjectID,ProjectCD,Description',
    });

    if (!results || results.length === 0) {
      throw new AcumaticaAPIError(`Project ${projectId} not found`, 404);
    }

    return results[0];
  }

  /**
   * Fetch invoices with filters
   */
  async fetchInvoices(filters: InvoiceQueryFilters): Promise<AcumaticaInvoice[]> {
    const filterParts: string[] = [];

    // Status filter - only released invoices (Open or Closed)
    filterParts.push("(Status eq 'Open' or Status eq 'Closed')");

    // Date range filter
    const startDateStr = filters.startDate.toISOString();
    filterParts.push(`Date ge datetimeoffset'${startDateStr}'`);

    if (filters.endDate) {
      const endDateStr = filters.endDate.toISOString();
      filterParts.push(`Date le datetimeoffset'${endDateStr}'`);
    }

    // Document type filter
    const docTypes: string[] = [];
    if (filters.includeInvoices) docTypes.push("Type eq 'Invoice'");
    if (filters.includeCreditMemos) docTypes.push("Type eq 'Credit Memo'");
    if (filters.includeDebitMemos) docTypes.push("Type eq 'Debit Memo'");

    if (docTypes.length > 0) {
      filterParts.push(`(${docTypes.join(' or ')})`);
    }

    // Branch filter
    if (filters.branches && filters.branches.length > 0) {
      const branchFilters = filters.branches
        .map((b) => `Branch eq '${b}'`)
        .join(' or ');
      filterParts.push(`(${branchFilters})`);
    }

    const params: Record<string, string> = {
      $select:
        'ReferenceNbr,Type,Status,Date,CustomerID,Customer,Amount,DocTotal,SalespersonID,Project,Branch,Details',
      $expand:
        'Details($select=InventoryID,Description,ExtendedPrice,Amount,ItemClass,Account,Qty,UnitPrice)',
      $filter: filterParts.join(' and '),
    };

    return this.get<AcumaticaInvoice[]>('SalesInvoice', params);
  }

  /**
   * Logout from Acumatica
   */
  async logout(): Promise<void> {
    if (this.cookies.length === 0) return;

    const logoutUrl = `${this.config.instanceUrl}/entity/auth/logout`;

    try {
      await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          Cookie: this.cookies.join('; '),
        },
      });
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      this.cookies = [];
    }
  }
}

/**
 * Create a new Acumatica client instance
 */
export function createAcumaticaClient(
  config: AcumaticaConnectionConfig
): AcumaticaClient {
  return new AcumaticaClient(config);
}
