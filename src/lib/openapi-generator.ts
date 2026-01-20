/**
 * Generate OpenAPI 3.0 specification for CommissionFlow API
 */
export function generateOpenApiSpec() {
  return {
    openapi: "3.0.0",
    info: {
      title: "CommissionFlow API",
      version: "1.0.0",
      description:
        "RESTful API for managing sales transactions, clients, projects, and commission data in CommissionFlow. Use API keys for authentication.",
      contact: {
        name: "API Support",
        url: "https://commissionflow.com",
      },
    },
    servers: [
      {
        url: "https://app.commissionflow.com/api/v1",
        description: "Production",
      },
      {
        url: "http://localhost:3000/api/v1",
        description: "Development",
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description: "API key for authentication. Format: Bearer cf_live_...",
        },
      },
      schemas: {
        SalesTransaction: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique transaction ID" },
            amount: { type: "number", description: "Transaction amount" },
            transactionDate: {
              type: "string",
              format: "date-time",
              description: "Date of transaction",
            },
            transactionType: {
              type: "string",
              enum: ["SALE", "RETURN", "ADJUSTMENT"],
              description: "Type of transaction",
            },
            projectId: {
              type: "string",
              nullable: true,
              description: "Associated project ID",
            },
            clientId: {
              type: "string",
              nullable: true,
              description: "Associated client ID",
            },
            userId: { type: "string", description: "Salesperson user ID" },
            productCategoryId: {
              type: "string",
              nullable: true,
              description: "Product category ID",
            },
            description: { type: "string", nullable: true },
            invoiceNumber: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Client: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            tier: {
              type: "string",
              enum: ["STANDARD", "VIP", "NEW", "ENTERPRISE"],
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "PROSPECTIVE", "CHURNED"],
            },
            territoryId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            clientId: { type: "string" },
            startDate: { type: "string", format: "date-time", nullable: true },
            endDate: { type: "string", format: "date-time", nullable: true },
            status: {
              type: "string",
              enum: ["active", "completed", "cancelled"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ProductCategory: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Territory: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            role: {
              type: "string",
              enum: ["ADMIN", "SALESPERSON"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Commission: {
          type: "object",
          properties: {
            id: { type: "string" },
            amount: { type: "number" },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "PAID"],
            },
            calculatedAt: { type: "string", format: "date-time" },
            approvedAt: { type: "string", format: "date-time", nullable: true },
            paidAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                type: { type: "string" },
                message: { type: "string" },
                details: { type: "object" },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
          },
        },
      },
    },
    paths: {
      "/sales": {
        get: {
          summary: "List sales transactions",
          tags: ["Sales"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 100 },
              description: "Items per page (max 100)",
            },
          ],
          "x-codeSamples": [
            {
              lang: "javascript",
              label: "JavaScript (fetch)",
              source: `const response = await fetch('https://app.commissionflow.com/api/v1/sales?page=1&limit=50', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer cf_live_your_api_key'
  }
});

const data = await response.json();
console.log(data.data.transactions);`,
            },
            {
              lang: "typescript",
              label: "TypeScript",
              source: `interface SalesResponse {
  data: {
    transactions: Array<{
      id: string;
      amount: number;
      transactionDate: string;
      userId: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

const response = await fetch('https://app.commissionflow.com/api/v1/sales?page=1&limit=50', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer cf_live_your_api_key'
  }
});

const data: SalesResponse = await response.json();
console.log(data.data.transactions);`,
            },
            {
              lang: "shell",
              label: "cURL",
              source: `curl -X GET "https://app.commissionflow.com/api/v1/sales?page=1&limit=50" \\
  -H "Authorization: Bearer cf_live_your_api_key"`,
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          transactions: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/SalesTransaction",
                            },
                          },
                          pagination: {
                            $ref: "#/components/schemas/Pagination",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        post: {
          summary: "Create sales transaction",
          tags: ["Sales"],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount", "transactionDate", "userId"],
                  properties: {
                    amount: { type: "number", minimum: 0.01 },
                    transactionDate: { type: "string", format: "date" },
                    userId: { type: "string" },
                    projectId: { type: "string" },
                    clientId: { type: "string" },
                    description: { type: "string" },
                    invoiceNumber: { type: "string" },
                    productCategoryId: { type: "string" },
                    transactionType: {
                      type: "string",
                      enum: ["SALE", "RETURN", "ADJUSTMENT"],
                      default: "SALE",
                    },
                  },
                },
              },
            },
          },
          "x-codeSamples": [
            {
              lang: "javascript",
              label: "JavaScript (fetch)",
              source: `const response = await fetch('https://app.commissionflow.com/api/v1/sales', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cf_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000,
    transactionDate: '2024-01-15',
    userId: 'user_abc123',
    projectId: 'proj_xyz789',
    description: 'Q1 Software License Sale'
  })
});

const data = await response.json();
console.log(data);`,
            },
            {
              lang: "typescript",
              label: "TypeScript",
              source: `interface CreateSaleRequest {
  amount: number;
  transactionDate: string;
  userId: string;
  projectId?: string;
  clientId?: string;
  description?: string;
  invoiceNumber?: string;
  productCategoryId?: string;
  transactionType?: 'SALE' | 'RETURN' | 'ADJUSTMENT';
}

interface CreateSaleResponse {
  data: {
    id: string;
    amount: number;
    transactionDate: string;
    userId: string;
  };
  message: string;
}

const createSale = async (sale: CreateSaleRequest): Promise<CreateSaleResponse> => {
  const response = await fetch('https://app.commissionflow.com/api/v1/sales', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer cf_live_your_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sale)
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return await response.json();
};

// Usage
const result = await createSale({
  amount: 5000,
  transactionDate: '2024-01-15',
  userId: 'user_abc123',
  projectId: 'proj_xyz789',
  description: 'Q1 Software License Sale'
});`,
            },
            {
              lang: "shell",
              label: "cURL",
              source: `curl -X POST https://app.commissionflow.com/api/v1/sales \\
  -H "Authorization: Bearer cf_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "transactionDate": "2024-01-15",
    "userId": "user_abc123",
    "projectId": "proj_xyz789",
    "description": "Q1 Software License Sale"
  }'`,
            },
          ],
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/SalesTransaction" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Bad Request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/sales/{id}": {
        get: {
          summary: "Get sales transaction",
          tags: ["Sales"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/SalesTransaction" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update sales transaction",
          tags: ["Sales"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    amount: { type: "number", minimum: 0.01 },
                    transactionDate: { type: "string", format: "date" },
                    description: { type: "string" },
                    invoiceNumber: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/SalesTransaction" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete sales transaction",
          tags: ["Sales"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/clients": {
        get: {
          summary: "List clients",
          tags: ["Clients"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 100 },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          clients: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Client" },
                          },
                          pagination: {
                            $ref: "#/components/schemas/Pagination",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create client",
          tags: ["Clients"],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", maxLength: 100 },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                    address: { type: "string" },
                    tier: {
                      type: "string",
                      enum: ["STANDARD", "VIP", "NEW", "ENTERPRISE"],
                    },
                    status: {
                      type: "string",
                      enum: ["ACTIVE", "INACTIVE", "PROSPECTIVE", "CHURNED"],
                    },
                    territoryId: { type: "string" },
                  },
                },
              },
            },
          },
          "x-codeSamples": [
            {
              lang: "javascript",
              label: "JavaScript (fetch)",
              source: `const response = await fetch('https://app.commissionflow.com/api/v1/clients', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cf_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    tier: 'ENTERPRISE',
    status: 'ACTIVE'
  })
});

const data = await response.json();
console.log(data);`,
            },
            {
              lang: "typescript",
              label: "TypeScript",
              source: `interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tier?: 'STANDARD' | 'VIP' | 'NEW' | 'ENTERPRISE';
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECTIVE' | 'CHURNED';
  territoryId?: string;
}

const createClient = async (client: CreateClientRequest) => {
  const response = await fetch('https://app.commissionflow.com/api/v1/clients', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer cf_live_your_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(client)
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return await response.json();
};

// Usage
const result = await createClient({
  name: 'Acme Corporation',
  email: 'contact@acme.com',
  phone: '+1-555-0123',
  tier: 'ENTERPRISE',
  status: 'ACTIVE'
});`,
            },
            {
              lang: "shell",
              label: "cURL",
              source: `curl -X POST https://app.commissionflow.com/api/v1/clients \\
  -H "Authorization: Bearer cf_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "tier": "ENTERPRISE",
    "status": "ACTIVE"
  }'`,
            },
          ],
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Client" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/clients/{id}": {
        get: {
          summary: "Get client",
          tags: ["Clients"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Client" },
                    },
                  },
                },
              },
            },
          },
        },
        put: {
          summary: "Update client",
          tags: ["Clients"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    tier: {
                      type: "string",
                      enum: ["STANDARD", "VIP", "NEW", "ENTERPRISE"],
                    },
                    status: {
                      type: "string",
                      enum: ["ACTIVE", "INACTIVE", "PROSPECTIVE", "CHURNED"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Client" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete client",
          tags: ["Clients"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Deleted",
            },
          },
        },
      },
      "/projects": {
        get: {
          summary: "List projects",
          tags: ["Projects"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 100 },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          projects: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Project" },
                          },
                          pagination: {
                            $ref: "#/components/schemas/Pagination",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create project",
          tags: ["Projects"],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "clientId"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    clientId: { type: "string" },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                    status: {
                      type: "string",
                      enum: ["active", "completed", "cancelled"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Project" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/projects/{id}": {
        get: {
          summary: "Get project",
          tags: ["Projects"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
          },
        },
        put: {
          summary: "Update project",
          tags: ["Projects"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["active", "completed", "cancelled"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Project" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete project",
          tags: ["Projects"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Deleted",
            },
          },
        },
      },
      "/product-categories": {
        get: {
          summary: "List product categories",
          tags: ["Product Categories"],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          categories: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/ProductCategory",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create product category",
          tags: ["Product Categories"],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProductCategory" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/territories": {
        get: {
          summary: "List territories",
          tags: ["Territories"],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          territories: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Territory" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create territory",
          tags: ["Territories"],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Territory" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/territories/{id}": {
        get: {
          summary: "Get territory",
          tags: ["Territories"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Territory" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update territory",
          tags: ["Territories"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Territory" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete territory",
          tags: ["Territories"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Deleted",
            },
          },
        },
      },
      "/product-categories/{id}": {
        get: {
          summary: "Get product category",
          tags: ["Product Categories"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProductCategory" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update product category",
          tags: ["Product Categories"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProductCategory" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete product category",
          tags: ["Product Categories"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Deleted",
            },
          },
        },
      },
      "/users": {
        get: {
          summary: "List users",
          description:
            "Get a paginated list of users/salespeople in your organization",
          tags: ["Users"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 100 },
              description: "Items per page (max 100)",
            },
            {
              name: "role",
              in: "query",
              schema: {
                type: "string",
                enum: ["ADMIN", "SALESPERSON"],
              },
              description: "Filter by role",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          users: {
                            type: "array",
                            items: { $ref: "#/components/schemas/User" },
                          },
                          pagination: {
                            $ref: "#/components/schemas/Pagination",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/commissions": {
        get: {
          summary: "List commissions",
          description: "Get a paginated list of commission calculations",
          tags: ["Commissions"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 100 },
              description: "Items per page (max 100)",
            },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["PENDING", "APPROVED", "PAID"],
              },
              description: "Filter by commission status",
            },
            {
              name: "userId",
              in: "query",
              schema: { type: "string" },
              description: "Filter by salesperson ID",
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter commissions from this date",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter commissions up to this date",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          commissions: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Commission" },
                          },
                          pagination: {
                            $ref: "#/components/schemas/Pagination",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/commissions/{id}": {
        get: {
          summary: "Get commission",
          description:
            "Get a single commission calculation with detailed explanation",
          tags: ["Commissions"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Commission" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  };
}
