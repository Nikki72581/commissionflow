# Territories API

The Territories API allows you to manage geographic or logical territories in CommissionFlow. Territories can be assigned to clients and used to configure territory-specific commission rules.

## Endpoints

- `GET /api/v1/territories` - List all territories
- `POST /api/v1/territories` - Create a territory
- `GET /api/v1/territories/{id}` - Get a single territory
- `PUT /api/v1/territories/{id}` - Update a territory
- `DELETE /api/v1/territories/{id}` - Delete a territory

## Required Scopes

- `territories:read` - For GET requests
- `territories:write` - For POST, PUT, DELETE requests

---

## List Territories

Get all territories for your organization.

**Endpoint**: `GET /api/v1/territories`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/territories \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "territories": [
      {
        "id": "terr_abc123",
        "name": "Northeast",
        "description": "NY, NJ, PA, CT, MA, RI, VT, NH, ME",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "clients": 45,
          "commissionRules": 2
        }
      },
      {
        "id": "terr_def456",
        "name": "West Coast",
        "description": "CA, OR, WA, NV, AZ",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "clients": 62,
          "commissionRules": 2
        }
      },
      {
        "id": "terr_ghi789",
        "name": "Central",
        "description": "TX, OK, KS, NE, SD, ND, MN, IA, MO, AR, LA",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "clients": 38,
          "commissionRules": 1
        }
      }
    ]
  }
}
```

---

## Create Territory

Create a new territory.

**Endpoint**: `POST /api/v1/territories`

### Request Body

| Field       | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| name        | string | Yes      | Territory name (max 100 characters)  |
| description | string | No       | Territory description                |

### Example Request

```bash
curl -X POST https://app.commissionflow.com/api/v1/territories \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Northeast",
    "description": "NY, NJ, PA, CT, MA, RI, VT, NH, ME"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "terr_abc123",
    "name": "Northeast",
    "description": "NY, NJ, PA, CT, MA, RI, VT, NH, ME",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Territory created successfully"
}
```

---

## Get Territory

Get a single territory by ID.

**Endpoint**: `GET /api/v1/territories/{id}`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/territories/terr_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "id": "terr_abc123",
    "name": "Northeast",
    "description": "NY, NJ, PA, CT, MA, RI, VT, NH, ME",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "_count": {
      "clients": 45,
      "commissionRules": 2
    }
  }
}
```

---

## Update Territory

Update an existing territory.

**Endpoint**: `PUT /api/v1/territories/{id}`

### Request Body

All fields are optional. Only include fields you want to update.

| Field       | Type   | Description                         |
| ----------- | ------ | ----------------------------------- |
| name        | string | Territory name (max 100 characters) |
| description | string | Territory description               |

### Example Request

```bash
curl -X PUT https://app.commissionflow.com/api/v1/territories/terr_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Northeast US: NY, NJ, PA, CT, MA, RI, VT, NH, ME, DE, MD, DC"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "terr_abc123",
    "name": "Northeast",
    "description": "Northeast US: NY, NJ, PA, CT, MA, RI, VT, NH, ME, DE, MD, DC",
    "updatedAt": "2024-01-16T09:15:00Z"
  },
  "message": "Territory updated successfully"
}
```

---

## Delete Territory

Delete a territory. Note: Cannot delete territories that are assigned to clients or referenced by commission rules.

**Endpoint**: `DELETE /api/v1/territories/{id}`

### Example Request

```bash
curl -X DELETE https://app.commissionflow.com/api/v1/territories/terr_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "message": "Territory deleted successfully"
  },
  "message": "Territory deleted successfully"
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
        "message": "Name is required"
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
    "message": "Cannot delete territory with associated clients or commission rules"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Territory not found"
  }
}
```

---

## Use Cases

### Territory-Based Commission Rules

Territories allow you to create different commission structures based on geography:

- **High-Growth Territories**: Higher commission rates to incentivize expansion
- **Established Territories**: Standard commission rates
- **Strategic Territories**: Custom rates for key markets

### Assigning Clients to Territories

When creating or updating clients, assign a `territoryId`:

```bash
curl -X POST https://app.commissionflow.com/api/v1/clients \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "territoryId": "terr_abc123"
  }'
```

### Territory-Based Reporting

Use territories to analyze sales performance by region. Clients in each territory will have their sales and commissions aggregated for territory-level reporting.

---

## Best Practices

1. **Define Clear Boundaries**: Use descriptions to clearly define what's included in each territory
2. **Consider Commission Rules**: Plan your territory structure around your commission strategy
3. **Avoid Overlaps**: Ensure territories don't overlap to prevent commission calculation conflicts
4. **Document Changes**: Update descriptions when territory boundaries change
5. **Start Broad**: Begin with larger territories and split as needed

## Common Territory Structures

### Geographic (US Example)
- Northeast, Southeast, Midwest, Southwest, West Coast

### International
- North America, EMEA, APAC, LATAM

### Account-Based
- Enterprise, Mid-Market, SMB

### Industry-Based
- Healthcare, Financial Services, Technology, Manufacturing

## See Also

- [Getting Started](./getting-started.md)
- [Clients API](./clients.md)
- [Error Handling](./errors.md)
