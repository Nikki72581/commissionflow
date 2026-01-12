# Sales Transactions API

The Sales Transactions API allows you to create, read, update, and delete sales transactions in CommissionFlow.

## Endpoints

- `GET /api/v1/sales` - List sales transactions
- `POST /api/v1/sales` - Create a sales transaction
- `GET /api/v1/sales/{id}` - Get a single sales transaction
- `PUT /api/v1/sales/{id}` - Update a sales transaction
- `DELETE /api/v1/sales/{id}` - Delete a sales transaction

## Required Scopes

- `sales:read` - For GET requests
- `sales:write` - For POST, PUT, DELETE requests

---

## List Sales Transactions

Get a paginated list of all sales transactions for your organization.

**Endpoint**: `GET /api/v1/sales`

### Query Parameters

| Parameter | Type    | Default | Description                |
| --------- | ------- | ------- | -------------------------- |
| page      | integer | 1       | Page number                |
| limit     | integer | 50      | Items per page (max 100)   |

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/sales?page=1&limit=20 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "transactions": [
      {
        "id": "sale_abc123",
        "amount": 5000,
        "transactionDate": "2024-01-15T00:00:00Z",
        "transactionType": "SALE",
        "projectId": "proj_xyz789",
        "clientId": "client_def456",
        "userId": "user_ghi789",
        "productCategoryId": null,
        "description": "Q1 Software License",
        "invoiceNumber": "INV-2024-001",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "project": {
          "id": "proj_xyz789",
          "name": "Enterprise Deployment",
          "client": {
            "id": "client_def456",
            "name": "Acme Corp"
          }
        },
        "user": {
          "id": "user_ghi789",
          "firstName": "John",
          "lastName": "Smith",
          "email": "john@example.com"
        },
        "commissionCalculations": [
          {
            "id": "calc_jkl012",
            "amount": 500,
            "status": "APPROVED"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

## Create Sales Transaction

Create a new sales transaction.

**Endpoint**: `POST /api/v1/sales`

### Request Body

| Field              | Type   | Required | Description                                  |
| ------------------ | ------ | -------- | -------------------------------------------- |
| amount             | number | Yes      | Transaction amount (must be > 0)             |
| transactionDate    | string | Yes      | Date in ISO format (YYYY-MM-DD)              |
| userId             | string | Yes      | ID of the salesperson                        |
| projectId          | string | No       | Project ID (may be required by organization) |
| clientId           | string | No       | Client ID (for sales without projects)       |
| description        | string | No       | Transaction description                      |
| invoiceNumber      | string | No       | Invoice number                               |
| productCategoryId  | string | No       | Product category ID                          |
| transactionType    | string | No       | SALE, RETURN, or ADJUSTMENT (default: SALE)  |

### Example Request

```bash
curl -X POST https://app.commissionflow.com/api/v1/sales \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "transactionDate": "2024-01-15",
    "userId": "user_ghi789",
    "projectId": "proj_xyz789",
    "description": "Q1 Software License",
    "invoiceNumber": "INV-2024-001"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "sale_abc123",
    "amount": 5000,
    "transactionDate": "2024-01-15T00:00:00Z",
    "transactionType": "SALE",
    "projectId": "proj_xyz789",
    "userId": "user_ghi789",
    "description": "Q1 Software License",
    "invoiceNumber": "INV-2024-001",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Sale created successfully"
}
```

---

## Get Sales Transaction

Get a single sales transaction by ID.

**Endpoint**: `GET /api/v1/sales/{id}`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/sales/sale_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "id": "sale_abc123",
    "amount": 5000,
    "transactionDate": "2024-01-15T00:00:00Z",
    "transactionType": "SALE",
    "projectId": "proj_xyz789",
    "userId": "user_ghi789",
    "description": "Q1 Software License",
    "invoiceNumber": "INV-2024-001",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "project": {
      "id": "proj_xyz789",
      "name": "Enterprise Deployment",
      "client": {
        "id": "client_def456",
        "name": "Acme Corp"
      }
    },
    "user": {
      "id": "user_ghi789",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com"
    },
    "commissionCalculations": []
  }
}
```

---

## Update Sales Transaction

Update an existing sales transaction.

**Endpoint**: `PUT /api/v1/sales/{id}`

### Request Body

All fields are optional. Only include fields you want to update.

| Field              | Type   | Description                |
| ------------------ | ------ | -------------------------- |
| amount             | number | Transaction amount         |
| transactionDate    | string | Date (YYYY-MM-DD)          |
| description        | string | Description                |
| invoiceNumber      | string | Invoice number             |
| productCategoryId  | string | Product category ID        |
| transactionType    | string | SALE, RETURN, or ADJUSTMENT|

### Example Request

```bash
curl -X PUT https://app.commissionflow.com/api/v1/sales/sale_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5500,
    "description": "Q1 Software License - Updated"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "sale_abc123",
    "amount": 5500,
    "transactionDate": "2024-01-15T00:00:00Z",
    "transactionType": "SALE",
    "projectId": "proj_xyz789",
    "userId": "user_ghi789",
    "description": "Q1 Software License - Updated",
    "invoiceNumber": "INV-2024-001",
    "updatedAt": "2024-01-16T09:15:00Z"
  },
  "message": "Sale updated successfully"
}
```

---

## Delete Sales Transaction

Delete a sales transaction. Note: Cannot delete transactions with paid commissions.

**Endpoint**: `DELETE /api/v1/sales/{id}`

### Example Request

```bash
curl -X DELETE https://app.commissionflow.com/api/v1/sales/sale_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "message": "Sales transaction deleted successfully"
  },
  "message": "Sales transaction deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["amount"],
        "message": "Amount must be greater than 0"
      }
    ]
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Sales transaction not found"
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "type": "BAD_REQUEST",
    "message": "Cannot delete transaction with paid commissions"
  }
}
```

---

## Best Practices

1. **Batch Operations**: If you need to create multiple sales transactions, consider rate limits and implement retry logic
2. **Idempotency**: Use unique `invoiceNumber` values to prevent duplicate transactions
3. **Error Handling**: Always check response status codes and handle errors appropriately
4. **Pagination**: Use appropriate page sizes based on your needs (larger pages = fewer requests)
5. **Date Format**: Always use ISO 8601 format (YYYY-MM-DD) for dates

## See Also

- [Getting Started](./getting-started.md)
- [Clients API](./clients.md)
- [Projects API](./projects.md)
- [Error Handling](./errors.md)
