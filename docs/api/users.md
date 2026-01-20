# Users API

The Users API allows you to list salespeople and team members in your organization. This is essential for assigning sales transactions to the correct salesperson.

## Endpoints

- `GET /api/v1/users` - List users/salespeople

## Required Scopes

- `users:read` - For GET requests

---

## List Users

Get a paginated list of all users (salespeople) in your organization.

**Endpoint**: `GET /api/v1/users`

### Query Parameters

| Parameter | Type    | Default | Description                                  |
| --------- | ------- | ------- | -------------------------------------------- |
| page      | integer | 1       | Page number                                  |
| limit     | integer | 50      | Items per page (max 100)                     |
| role      | string  | -       | Filter by role: ADMIN or SALESPERSON         |

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/users?page=1&limit=20 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "users": [
      {
        "id": "user_abc123",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@company.com",
        "role": "SALESPERSON",
        "createdAt": "2024-01-15T10:30:00Z",
        "_count": {
          "salesTransactions": 42,
          "commissionCalculations": 38
        }
      },
      {
        "id": "user_def456",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@company.com",
        "role": "SALESPERSON",
        "createdAt": "2024-01-10T08:00:00Z",
        "_count": {
          "salesTransactions": 65,
          "commissionCalculations": 58
        }
      },
      {
        "id": "user_ghi789",
        "firstName": "Mike",
        "lastName": "Johnson",
        "email": "mike.johnson@company.com",
        "role": "MANAGER",
        "createdAt": "2024-01-05T09:00:00Z",
        "_count": {
          "salesTransactions": 12,
          "commissionCalculations": 10
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  }
}
```

### Filter by Role

Get only salespeople:

```bash
curl "https://app.commissionflow.com/api/v1/users?role=SALESPERSON" \
  -H "Authorization: Bearer cf_live_your_api_key"
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": {
    "type": "UNAUTHORIZED",
    "message": "Missing or invalid API key"
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "type": "FORBIDDEN",
    "message": "Missing required scope: users:read"
  }
}
```

---

## User Roles

| Role        | Description                                      |
| ----------- | ------------------------------------------------ |
| ADMIN       | Full access to all features and settings         |
| SALESPERSON | Can view own sales and commissions               |

---

## Common Use Cases

### Getting Valid User IDs for Sales Creation

Before creating a sales transaction, you need a valid `userId`. Use this endpoint to get the list of salespeople:

```javascript
// 1. Get list of salespeople
const usersResponse = await fetch(
  'https://app.commissionflow.com/api/v1/users?role=SALESPERSON',
  {
    headers: {
      'Authorization': 'Bearer cf_live_your_api_key'
    }
  }
);
const { data: { users } } = await usersResponse.json();

// 2. Find the salesperson by email or name
const salesperson = users.find(u => u.email === 'john.smith@company.com');

// 3. Create the sale with the user ID
const saleResponse = await fetch(
  'https://app.commissionflow.com/api/v1/sales',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer cf_live_your_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 5000,
      transactionDate: '2024-01-15',
      userId: salesperson.id,
      description: 'Q1 License Sale'
    })
  }
);
```

### Syncing Users with External Systems

If you maintain a separate CRM or HR system, use this endpoint to keep user records in sync:

```javascript
// Get all users from CommissionFlow
const response = await fetch(
  'https://app.commissionflow.com/api/v1/users',
  {
    headers: {
      'Authorization': 'Bearer cf_live_your_api_key'
    }
  }
);
const { data: { users } } = await response.json();

// Create a mapping of email to CommissionFlow user ID
const userMapping = {};
for (const user of users) {
  userMapping[user.email] = user.id;
}

// Use this mapping when importing sales from your CRM
```

---

## Best Practices

1. **Cache User Lists**: User lists don't change frequently; cache them to reduce API calls
2. **Use Role Filtering**: Filter by `SALESPERSON` role when building sales import workflows
3. **Match by Email**: Email addresses are typically the most reliable identifier for matching users across systems
4. **Handle Pagination**: For large teams, iterate through all pages to get the complete user list

## See Also

- [Getting Started](./getting-started.md)
- [Sales Transactions API](./sales-transactions.md)
- [Error Handling](./errors.md)
