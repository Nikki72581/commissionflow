# Commissions API

The Commissions API allows you to view commission calculations in CommissionFlow. Commission calculations are automatically generated when sales transactions are created, based on your active commission plans and rules.

## Endpoints

- `GET /api/v1/commissions` - List commission calculations
- `GET /api/v1/commissions/{id}` - Get a single commission calculation

## Required Scopes

- `commissions:read` - For GET requests

---

## List Commissions

Get a paginated list of commission calculations for your organization.

**Endpoint**: `GET /api/v1/commissions`

### Query Parameters

| Parameter | Type    | Default | Description                                          |
| --------- | ------- | ------- | ---------------------------------------------------- |
| page      | integer | 1       | Page number                                          |
| limit     | integer | 50      | Items per page (max 100)                             |
| status    | string  | -       | Filter by status: PENDING, APPROVED, or PAID         |
| userId    | string  | -       | Filter by salesperson ID                             |
| startDate | string  | -       | Filter commissions from this date (YYYY-MM-DD)       |
| endDate   | string  | -       | Filter commissions up to this date (YYYY-MM-DD)      |

### Example Request

```bash
curl "https://app.commissionflow.com/api/v1/commissions?page=1&limit=20&status=PENDING" \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "commissions": [
      {
        "id": "comm_abc123",
        "amount": 500.00,
        "status": "PENDING",
        "calculatedAt": "2024-01-15T10:30:00Z",
        "approvedAt": null,
        "paidAt": null,
        "salesTransaction": {
          "id": "sale_xyz789",
          "amount": 5000.00,
          "transactionDate": "2024-01-15T00:00:00Z",
          "description": "Q1 Software License"
        },
        "user": {
          "id": "user_def456",
          "firstName": "John",
          "lastName": "Smith",
          "email": "john.smith@company.com"
        },
        "commissionPlan": {
          "id": "plan_ghi012",
          "name": "Standard Sales Plan"
        },
        "commissionRule": {
          "id": "rule_jkl345",
          "name": "10% Base Commission",
          "type": "PERCENTAGE",
          "value": 10
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

### Filter Examples

**Get pending commissions for a specific salesperson:**

```bash
curl "https://app.commissionflow.com/api/v1/commissions?status=PENDING&userId=user_abc123" \
  -H "Authorization: Bearer cf_live_your_api_key"
```

**Get commissions for a date range:**

```bash
curl "https://app.commissionflow.com/api/v1/commissions?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer cf_live_your_api_key"
```

**Get paid commissions:**

```bash
curl "https://app.commissionflow.com/api/v1/commissions?status=PAID" \
  -H "Authorization: Bearer cf_live_your_api_key"
```

---

## Get Commission

Get a single commission calculation by ID, including detailed calculation explanation.

**Endpoint**: `GET /api/v1/commissions/{id}`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/commissions/comm_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "id": "comm_abc123",
    "amount": 500.00,
    "status": "APPROVED",
    "calculatedAt": "2024-01-15T10:30:00Z",
    "approvedAt": "2024-01-16T14:00:00Z",
    "paidAt": null,
    "salesTransaction": {
      "id": "sale_xyz789",
      "amount": 5000.00,
      "transactionDate": "2024-01-15T00:00:00Z",
      "transactionType": "SALE",
      "description": "Q1 Software License",
      "invoiceNumber": "INV-2024-001",
      "project": {
        "id": "proj_mno678",
        "name": "Enterprise Deployment"
      },
      "client": {
        "id": "client_pqr901",
        "name": "Acme Corporation",
        "tier": "ENTERPRISE"
      }
    },
    "user": {
      "id": "user_def456",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@company.com"
    },
    "commissionPlan": {
      "id": "plan_ghi012",
      "name": "Standard Sales Plan",
      "description": "Default commission plan for all sales"
    },
    "commissionRule": {
      "id": "rule_jkl345",
      "name": "10% Base Commission",
      "type": "PERCENTAGE",
      "value": 10,
      "minAmount": null,
      "maxAmount": 1000
    },
    "explanation": {
      "ruleTrace": [
        {
          "ruleId": "rule_jkl345",
          "ruleName": "10% Base Commission",
          "matched": true,
          "reason": "Sale amount $5000 qualifies for percentage commission"
        }
      ],
      "calculation": {
        "saleAmount": 5000,
        "ruleType": "PERCENTAGE",
        "ruleValue": 10,
        "calculatedAmount": 500,
        "maxCap": 1000,
        "finalAmount": 500
      },
      "inputSnapshot": {
        "saleAmount": 5000,
        "clientTier": "ENTERPRISE",
        "productCategory": null,
        "territory": "Northeast"
      }
    }
  }
}
```

---

## Commission Statuses

| Status   | Description                                           |
| -------- | ----------------------------------------------------- |
| PENDING  | Commission calculated, awaiting approval              |
| APPROVED | Commission approved, ready for payment                |
| PAID     | Commission has been paid out to the salesperson       |

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
    "message": "Missing required scope: commissions:read"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Commission calculation not found"
  }
}
```

---

## Understanding Commission Calculations

### How Commissions Are Calculated

1. **Sale Created**: When a sales transaction is created, the system evaluates all active commission plans
2. **Rule Matching**: Each rule in matching plans is evaluated against the sale
3. **Calculation**: For matching rules, the commission amount is calculated based on rule type
4. **Status**: New commissions start in PENDING status

### Rule Types

| Type       | Description                                       | Example                    |
| ---------- | ------------------------------------------------- | -------------------------- |
| PERCENTAGE | Percentage of sale amount                         | 10% of $5000 = $500        |
| FLAT       | Fixed amount per sale                             | $100 per sale              |
| TIERED     | Different rates at different thresholds           | 10% up to $10K, 15% above  |

### Commission Caps

Rules can have minimum and maximum caps:
- `minAmount`: Minimum commission (floor)
- `maxAmount`: Maximum commission (ceiling)

---

## Common Use Cases

### Building a Commission Report

```javascript
// Get all paid commissions for the month
const response = await fetch(
  'https://app.commissionflow.com/api/v1/commissions?status=PAID&startDate=2024-01-01&endDate=2024-01-31',
  {
    headers: {
      'Authorization': 'Bearer cf_live_your_api_key'
    }
  }
);

const { data } = await response.json();

// Calculate totals by salesperson
const totals = {};
for (const commission of data.commissions) {
  const userId = commission.user.id;
  const name = `${commission.user.firstName} ${commission.user.lastName}`;
  
  if (!totals[userId]) {
    totals[userId] = { name, amount: 0, count: 0 };
  }
  
  totals[userId].amount += commission.amount;
  totals[userId].count += 1;
}

console.log('Commission Totals:', totals);
```

### Syncing with Payroll Systems

```javascript
// Get approved commissions ready for payment
async function getCommissionsForPayroll() {
  const commissions = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://app.commissionflow.com/api/v1/commissions?status=APPROVED&page=${page}&limit=100`,
      {
        headers: {
          'Authorization': 'Bearer cf_live_your_api_key'
        }
      }
    );

    const { data } = await response.json();
    commissions.push(...data.commissions);

    hasMore = data.pagination.page < data.pagination.pages;
    page++;
  }

  return commissions;
}
```

---

## Best Practices

1. **Use Filters**: Always filter by status and date range to get relevant data
2. **Pagination**: Handle pagination for large result sets
3. **Cache Selectively**: Commission data changes frequently; cache cautiously
4. **Check Explanations**: Use the detailed explanation for auditing and debugging

## See Also

- [Getting Started](./getting-started.md)
- [Sales Transactions API](./sales-transactions.md)
- [Users API](./users.md)
- [Error Handling](./errors.md)
