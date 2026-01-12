# Getting Started with CommissionFlow API

The CommissionFlow API allows you to programmatically push sales transactions, manage clients, projects, and other data to your CommissionFlow account.

## Authentication

All API requests require authentication using an API key. API keys are scoped to your organization and have specific permissions (scopes).

### Creating an API Key

1. Log in to your CommissionFlow account
2. Navigate to **Settings** → **API Keys** (Admin only)
3. Click "Create API Key"
4. Enter a name for the key
5. Select the required scopes (e.g., `sales:read`, `sales:write`, `clients:read`, etc.)
6. Optionally set an expiration date and rate limit
7. Click "Create"
8. **Important**: Copy the API key immediately - it will only be shown once!

### Using Your API Key

Include your API key in the `Authorization` header of every request:

```bash
Authorization: Bearer cf_live_your_api_key_here
```

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/sales \
  -H "Authorization: Bearer cf_live_your_api_key_here" \
  -H "Content-Type: application/json"
```

## Base URL

**Production**: `https://app.commissionflow.com/api/v1`
**Development**: `http://localhost:3000/api/v1`

## API Scopes

API keys use scope-based permissions for fine-grained access control:

- `sales:read` - Read sales transactions
- `sales:write` - Create, update, and delete sales transactions
- `clients:read` - Read clients
- `clients:write` - Create, update, and delete clients
- `projects:read` - Read projects
- `projects:write` - Create, update, and delete projects
- `categories:read` - Read product categories
- `categories:write` - Create product categories
- `territories:read` - Read territories
- `territories:write` - Create territories
- `*` - All permissions (use with caution)

## Rate Limiting

API requests are rate-limited to **1000 requests per hour** by default (configurable per key).

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 2024-01-15T15:00:00Z
```

When the rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Response Format

All successful responses follow this format:

```json
{
  "data": {
    // Response data here
  },
  "message": "Optional success message"
}
```

Error responses follow this format:

```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional error details
    }
  }
}
```

## Pagination

List endpoints support pagination with query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

Example:

```bash
GET /api/v1/sales?page=2&limit=25
```

Response includes pagination metadata:

```json
{
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 2,
      "limit": 25,
      "total": 150,
      "pages": 6
    }
  }
}
```

## Common HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request (validation error)
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - API key lacks required scope
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Next Steps

- [Sales Transactions API](./sales-transactions.md)
- [Clients API](./clients.md)
- [Projects API](./projects.md)
- [Error Handling](./errors.md)
- [Interactive API Documentation](https://app.commissionflow.com/api/v1/openapi.json)
