# Projects API

The Projects API allows you to create, read, update, and delete project records in CommissionFlow. Projects are linked to clients and can have commission plans assigned to them.

## Endpoints

- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create a project
- `GET /api/v1/projects/{id}` - Get a single project
- `PUT /api/v1/projects/{id}` - Update a project
- `DELETE /api/v1/projects/{id}` - Delete a project

## Required Scopes

- `projects:read` - For GET requests
- `projects:write` - For POST, PUT, DELETE requests

---

## List Projects

Get a paginated list of all projects for your organization.

**Endpoint**: `GET /api/v1/projects`

### Query Parameters

| Parameter | Type    | Default | Description              |
| --------- | ------- | ------- | ------------------------ |
| page      | integer | 1       | Page number              |
| limit     | integer | 50      | Items per page (max 100) |

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/projects?page=1&limit=20 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "projects": [
      {
        "id": "proj_abc123",
        "name": "Enterprise Deployment",
        "description": "Full enterprise software deployment for Acme Corp",
        "clientId": "client_xyz789",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-06-30T00:00:00Z",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "client": {
          "id": "client_xyz789",
          "name": "Acme Corporation",
          "tier": "ENTERPRISE",
          "status": "ACTIVE"
        },
        "_count": {
          "salesTransactions": 12,
          "commissionPlans": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 75,
      "pages": 4
    }
  }
}
```

---

## Create Project

Create a new project.

**Endpoint**: `POST /api/v1/projects`

### Request Body

| Field       | Type   | Required | Description                                      |
| ----------- | ------ | -------- | ------------------------------------------------ |
| name        | string | Yes      | Project name (max 100 characters)                |
| clientId    | string | Yes      | ID of the client this project belongs to         |
| description | string | No       | Project description                              |
| startDate   | string | No       | Start date in ISO format (YYYY-MM-DD)            |
| endDate     | string | No       | End date in ISO format (YYYY-MM-DD)              |
| status      | string | No       | active, completed, or cancelled (default: active)|

### Example Request

```bash
curl -X POST https://app.commissionflow.com/api/v1/projects \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Deployment",
    "clientId": "client_xyz789",
    "description": "Full enterprise software deployment",
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "status": "active"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "Enterprise Deployment",
    "description": "Full enterprise software deployment",
    "clientId": "client_xyz789",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-06-30T00:00:00Z",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "client": {
      "id": "client_xyz789",
      "name": "Acme Corporation"
    }
  },
  "message": "Project created successfully"
}
```

---

## Get Project

Get a single project by ID.

**Endpoint**: `GET /api/v1/projects/{id}`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/projects/proj_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "Enterprise Deployment",
    "description": "Full enterprise software deployment for Acme Corp",
    "clientId": "client_xyz789",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-06-30T00:00:00Z",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "client": {
      "id": "client_xyz789",
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "tier": "ENTERPRISE",
      "status": "ACTIVE"
    },
    "commissionPlans": [
      {
        "id": "plan_def456",
        "name": "Enterprise Sales Plan",
        "isActive": true
      }
    ],
    "_count": {
      "salesTransactions": 12,
      "commissionPlans": 1
    }
  }
}
```

---

## Update Project

Update an existing project.

**Endpoint**: `PUT /api/v1/projects/{id}`

### Request Body

All fields are optional. Only include fields you want to update.

| Field       | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| name        | string | Project name                             |
| description | string | Project description                      |
| clientId    | string | Client ID (transfer to different client) |
| startDate   | string | Start date (YYYY-MM-DD)                  |
| endDate     | string | End date (YYYY-MM-DD)                    |
| status      | string | active, completed, or cancelled          |

### Example Request

```bash
curl -X PUT https://app.commissionflow.com/api/v1/projects/proj_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "endDate": "2024-05-15"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "Enterprise Deployment",
    "description": "Full enterprise software deployment for Acme Corp",
    "clientId": "client_xyz789",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-05-15T00:00:00Z",
    "status": "completed",
    "updatedAt": "2024-05-15T09:15:00Z",
    "client": {
      "id": "client_xyz789",
      "name": "Acme Corporation"
    }
  },
  "message": "Project updated successfully"
}
```

---

## Delete Project

Delete a project. Note: Cannot delete projects with associated sales transactions or commission plans.

**Endpoint**: `DELETE /api/v1/projects/{id}`

### Example Request

```bash
curl -X DELETE https://app.commissionflow.com/api/v1/projects/proj_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "message": "Project deleted successfully"
  },
  "message": "Project deleted successfully"
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
        "path": ["clientId"],
        "message": "Client is required"
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
    "message": "Cannot delete project with associated sales transactions or commission plans"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Project not found"
  }
}
```

### 500 Internal Error - Client Not Found

```json
{
  "error": {
    "type": "INTERNAL_ERROR",
    "message": "Client not found"
  }
}
```

---

## Project Statuses

| Status    | Description                                  |
| --------- | -------------------------------------------- |
| active    | Project is currently in progress             |
| completed | Project has been successfully completed      |
| cancelled | Project was cancelled before completion      |

---

## Best Practices

1. **Link to Clients**: Always associate projects with a valid client
2. **Set Date Ranges**: Use startDate and endDate for time-based reporting and filtering
3. **Update Status**: Keep project status current for accurate commission calculations
4. **Plan Ahead**: Remove commission plans before attempting to delete projects
5. **Use Descriptions**: Add meaningful descriptions for team reference

## Common Workflows

### Creating a Project with Sales

1. Create the client (if not exists): `POST /api/v1/clients`
2. Create the project: `POST /api/v1/projects`
3. Create sales transactions: `POST /api/v1/sales` with the `projectId`

### Closing a Project

1. Update project status to completed: `PUT /api/v1/projects/{id}`
2. Review associated commissions in the dashboard
3. Process any pending commission approvals

## See Also

- [Getting Started](./getting-started.md)
- [Clients API](./clients.md)
- [Sales Transactions API](./sales-transactions.md)
- [Error Handling](./errors.md)
