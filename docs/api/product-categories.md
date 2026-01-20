# Product Categories API

The Product Categories API allows you to manage product categories in CommissionFlow. Product categories can be used to categorize sales transactions and configure category-specific commission rules.

## Endpoints

- `GET /api/v1/product-categories` - List all product categories
- `POST /api/v1/product-categories` - Create a product category
- `GET /api/v1/product-categories/{id}` - Get a single product category
- `PUT /api/v1/product-categories/{id}` - Update a product category
- `DELETE /api/v1/product-categories/{id}` - Delete a product category

## Required Scopes

- `categories:read` - For GET requests
- `categories:write` - For POST, PUT, DELETE requests

---

## List Product Categories

Get all product categories for your organization.

**Endpoint**: `GET /api/v1/product-categories`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/product-categories \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "categories": [
      {
        "id": "cat_abc123",
        "name": "Software Licenses",
        "description": "Recurring and perpetual software licenses",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "salesTransactions": 150,
          "commissionRules": 3
        }
      },
      {
        "id": "cat_def456",
        "name": "Professional Services",
        "description": "Consulting, implementation, and training services",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "salesTransactions": 45,
          "commissionRules": 2
        }
      },
      {
        "id": "cat_ghi789",
        "name": "Hardware",
        "description": "Physical hardware products",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "salesTransactions": 30,
          "commissionRules": 1
        }
      }
    ]
  }
}
```

---

## Create Product Category

Create a new product category.

**Endpoint**: `POST /api/v1/product-categories`

### Request Body

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| name        | string | Yes      | Category name (max 100 characters)    |
| description | string | No       | Category description                  |

### Example Request

```bash
curl -X POST https://app.commissionflow.com/api/v1/product-categories \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Software Licenses",
    "description": "Recurring and perpetual software licenses"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "cat_abc123",
    "name": "Software Licenses",
    "description": "Recurring and perpetual software licenses",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Product category created successfully"
}
```

---

## Get Product Category

Get a single product category by ID.

**Endpoint**: `GET /api/v1/product-categories/{id}`

### Example Request

```bash
curl https://app.commissionflow.com/api/v1/product-categories/cat_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "id": "cat_abc123",
    "name": "Software Licenses",
    "description": "Recurring and perpetual software licenses",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "_count": {
      "salesTransactions": 150,
      "commissionRules": 3
    }
  }
}
```

---

## Update Product Category

Update an existing product category.

**Endpoint**: `PUT /api/v1/product-categories/{id}`

### Request Body

All fields are optional. Only include fields you want to update.

| Field       | Type   | Description                        |
| ----------- | ------ | ---------------------------------- |
| name        | string | Category name (max 100 characters) |
| description | string | Category description               |

### Example Request

```bash
curl -X PUT https://app.commissionflow.com/api/v1/product-categories/cat_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "All software licenses including SaaS subscriptions"
  }'
```

### Example Response

```json
{
  "data": {
    "id": "cat_abc123",
    "name": "Software Licenses",
    "description": "All software licenses including SaaS subscriptions",
    "updatedAt": "2024-01-16T09:15:00Z"
  },
  "message": "Product category updated successfully"
}
```

---

## Delete Product Category

Delete a product category. Note: Cannot delete categories that are referenced by sales transactions or commission rules.

**Endpoint**: `DELETE /api/v1/product-categories/{id}`

### Example Request

```bash
curl -X DELETE https://app.commissionflow.com/api/v1/product-categories/cat_abc123 \
  -H "Authorization: Bearer cf_live_your_api_key"
```

### Example Response

```json
{
  "data": {
    "message": "Product category deleted successfully"
  },
  "message": "Product category deleted successfully"
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
    "message": "Cannot delete product category with associated sales transactions or commission rules"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Product category not found"
  }
}
```

---

## Use Cases

### Category-Based Commission Rules

Product categories allow you to create different commission rates for different types of products:

- **Software Licenses**: 15% commission rate
- **Professional Services**: 10% commission rate
- **Hardware**: 5% commission rate

### Sales Categorization

When creating sales transactions, assign a `productCategoryId` to categorize the sale:

```bash
curl -X POST https://app.commissionflow.com/api/v1/sales \
  -H "Authorization: Bearer cf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "transactionDate": "2024-01-15",
    "userId": "user_abc123",
    "productCategoryId": "cat_abc123"
  }'
```

---

## Best Practices

1. **Keep Categories Broad**: Create categories that represent product lines, not individual products
2. **Use Descriptions**: Add clear descriptions for team reference
3. **Plan Commission Rules**: Consider commission implications before creating categories
4. **Avoid Deletion**: Once categories have transactions, consider marking them inactive rather than deleting

## See Also

- [Getting Started](./getting-started.md)
- [Sales Transactions API](./sales-transactions.md)
- [Error Handling](./errors.md)
