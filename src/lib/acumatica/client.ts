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
   * Authenticate with Acumatica using cookie-based session authentication
   */
  async authenticate(): Promise<void> {
    if (this.config.credentials.type !== 'password') {
      throw new Error('Only password authentication is currently supported');
    }

    const { username, password } = this.config.credentials;
    const loginUrl = `${this.config.instanceUrl}/entity/auth/login`;

    try {
      console.log('[Acumatica Client] Attempting session login...');
      console.log('[Acumatica Client] Login URL:', loginUrl);
      console.log('[Acumatica Client] Username:', username);
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

        // Provide helpful error messages based on status code
        let helpMessage = '';
        if (loginResponse.status === 400) {
          helpMessage = ' Possible issues: Wrong username/password, or company ID not found.';
        } else if (loginResponse.status === 401) {
          helpMessage = ' Check username and password are correct.';
        } else if (loginResponse.status === 403) {
          helpMessage = ' User may not have permissions or account is locked.';
        }

        throw new AcumaticaAPIError(
          `Login failed (${loginResponse.status}): ${error.message || errorText || 'Authentication failed'}.${helpMessage}`,
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
   * Authenticate without a specific company to list available companies
   */
  async authenticateWithoutCompany(): Promise<void> {
    if (this.config.credentials.type !== 'password') {
      throw new Error('Only password authentication is currently supported');
    }

    const { username, password } = this.config.credentials;
    const loginUrl = `${this.config.instanceUrl}/entity/auth/login`;

    try {
      console.log('[Acumatica Client] Attempting login without company to list available companies...');

      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          password: password,
          // Omit company to login to default/list companies
        }),
      });

      console.log('[Acumatica Client] Login response status:', loginResponse.status);

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('[Acumatica Client] Login failed:', {
          status: loginResponse.status,
          statusText: loginResponse.statusText,
          responseBody: errorText,
        });

        throw new AcumaticaAPIError(
          `Login failed (${loginResponse.status}): Unable to authenticate to list companies. Check username and password.`,
          loginResponse.status
        );
      }

      // Store cookies for subsequent requests
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        this.cookies = cookies.split(',').map((c) => c.split(';')[0].trim());
        console.log('[Acumatica Client] Cookies stored:', this.cookies.length);
      }
    } catch (error) {
      if (error instanceof AcumaticaAPIError) {
        throw error;
      }
      throw new AcumaticaAPIError(
        `Authentication error: ${(error as Error).message}`
      );
    }
  }

  /**
   * List available companies (tenants) in the Acumatica instance
   */
  async listCompanies(): Promise<AcumaticaCompany[]> {
    await this.authenticateWithoutCompany();
    return this.get<AcumaticaCompany[]>('Company', {
      $select: 'CompanyID,CompanyName',
    });
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
