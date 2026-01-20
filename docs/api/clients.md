# Clients API

The Clients API allows you to create, read, update, and delete client records in CommissionFlow.

## Endpoints

- `GET /api/v1/clients` - List clients
- `POST /api/v1/clients` - Create a client
- `GET /api/v1/clients/{id}` - Get a single client
- `PUT /api/v1/clients/{id}` - Update a client
- `DELETE /api/v1/clients/{id}` - Delete a client

## Required Scopes

- `clients:read` - For GET requests
- `clients:write` - For POST, PUT, DELETE requests

---

## List Clients

Get a paginated list of all clients for your organization.

**Endpoint**: `GET /api/v1/clients`

### Query Parameters

| Parameter | Type    | Default | Description              |
| --------- | ------- | ------- | ------------------------ |
| page      | integer | 1       | Page number              |
| limit     | integer | 50      | Items per page (max 100) |

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/clients?page=1&limit=20 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "clients": [
      {
        "id": "client_abc123",
        "name": "Acme Corporation",
        "email": "contact@acme.com",
        "phone": "+1-555-0123",
        "address": "123 Main St, New York, NY 10001",
        "notes": "Enterprise customer since 2020",
        "tier": "ENTERPRISE",
        "status": "ACTIVE",
        "clientId": "ACME-001",
        "territoryId": "terr_xyz789",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "territory": {
          "id": "terr_xyz789",
          "name": "Northeast"
        },
        "_count": {
          "projects": 5,
          "salesTransactions": 42
        }
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

## Create Client

Create a new client.

**Endpoint**: `POST /api/v1/clients`

### Request Body

| Field       | Type   | Required | Description                                           |
| ----------- | ------ | -------- | ----------------------------------------------------- |
| name        | string | Yes      | Client name (max 100 characters)                      |
| email       | string | No       | Email address                                         |
| phone       | string | No       | Phone number                                          |
| address     | string | No       | Physical address                                      |
| notes       | string | No       | Internal notes about the client                       |
| tier        | string | No       | STANDARD, VIP, NEW, or ENTERPRISE (default: STANDARD) |
| status      | string | No       | ACTIVE, INACTIVE, PROSPECTIVE, or CHURNED (default: ACTIVE) |
| clientId    | string | No       | Your external client ID for reference                 |
| territoryId | string | No       | Territory ID to assign the client to                  |

### Example Request

```bash
curl -X POST https://app.commissionflow.com/api/v1/clients \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "tier": "ENTERPRISE",
    "status": "ACTIVE",
    "clientId": "ACME-001",
    "territoryId": "terr_xyz789"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "client_abc123",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "tier": "ENTERPRISE",
    "status": "ACTIVE",
    "clientId": "ACME-001",
    "territoryId": "terr_xyz789",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "territory": {
      "id": "terr_xyz789",
      "name": "Northeast"
    }
  },
  "message": "Client created successfully"
}
```

---

## Get Client

Get a single client by ID.

**Endpoint**: `GET /api/v1/clients/{id}`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/clients/client_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "id": "client_abc123",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "notes": "Enterprise customer since 2020",
    "tier": "ENTERPRISE",
    "status": "ACTIVE",
    "clientId": "ACME-001",
    "territoryId": "terr_xyz789",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "territory": {
      "id": "terr_xyz789",
      "name": "Northeast"
    },
    "projects": [
      {
        "id": "proj_def456",
        "name": "Enterprise Deployment",
        "status": "active"
      },
      {
        "id": "proj_ghi789",
        "name": "Support Contract 2024",
        "status": "active"
      }
    ],
    "_count": {
      "projects": 2,
      "salesTransactions": 15
    }
  }
}
```

---

## Update Client

Update an existing client.

**Endpoint**: `PUT /api/v1/clients/{id}`

### Request Body

All fields are optional. Only include fields you want to update.

| Field       | Type   | Description                                      |
| ----------- | ------ | ------------------------------------------------ |
| name        | string | Client name                                      |
| email       | string | Email address                                    |
| phone       | string | Phone number                                     |
| address     | string | Physical address                                 |
| notes       | string | Internal notes                                   |
| tier        | string | STANDARD, VIP, NEW, or ENTERPRISE                |
| status      | string | ACTIVE, INACTIVE, PROSPECTIVE, or CHURNED        |
| clientId    | string | External client ID                               |
| territoryId | string | Territory ID (use null to remove)                |

### Example Request

```bash
curl -X PUT https://app.commissionflow.com/api/v1/clients/client_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "VIP",
    "notes": "Upgraded to VIP tier after Q4 performance"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "client_abc123",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "notes": "Upgraded to VIP tier after Q4 performance",
    "tier": "VIP",
    "status": "ACTIVE",
    "territoryId": "terr_xyz789",
    "updatedAt": "2024-01-16T09:15:00Z",
    "territory": {
      "id": "terr_xyz789",
      "name": "Northeast"
    }
  },
  "message": "Client updated successfully"
}
```

---

## Delete Client

Delete a client. Note: Cannot delete clients with associated projects or sales transactions.

**Endpoint**: `DELETE /api/v1/clients/{id}`

### Example Request

```bash
curl -X DELETE https://app.commissionflow.com/api/v1/clients/client_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "message": "Client deleted successfully"
  },
  "message": "Client deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["name"],
        "message": "Client name is required"
      }
    ]
  }
}
```

### 400 Bad Request - Cannot Delete

```json
{
  "error": {
    "type": "BAD_REQUEST",
    "message": "Cannot delete client with associated projects or sales transactions"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Client not found"
  }
}
```

### 404 Not Found - Territory

```json
{
  "error": {
    "type": "INTERNAL_ERROR",
    "message": "Territory not found"
  }
}
```

---

## Client Tiers

Clients can be categorized into tiers for commission rules:

| Tier       | Description                              |
| ---------- | ---------------------------------------- |
| STANDARD   | Default tier for regular clients         |
| VIP        | High-value or priority clients           |
| NEW        | Recently acquired clients                |
| ENTERPRISE | Large enterprise accounts                |

## Client Statuses

| Status      | Description                              |
| ----------- | ---------------------------------------- |
| ACTIVE      | Currently active client                  |
| INACTIVE    | Temporarily inactive                     |
| PROSPECTIVE | Potential client (not yet converted)     |
| CHURNED     | Former client who has left               |

---

## Best Practices

1. **Use External IDs**: Set `clientId` to your CRM or ERP client ID for easy cross-referencing
2. **Assign Territories**: Link clients to territories for geographic commission rules
3. **Track Status**: Keep client status updated to maintain accurate reporting
4. **Use Tiers**: Assign appropriate tiers for tier-based commission calculations
5. **Validate Before Delete**: Check for dependencies before attempting to delete

## See Also

- [Getting Started](./getting-started.md)
- [Projects API](./projects.md)
- [Territories API](./territories.md)
- [Error Handling](./errors.md)
