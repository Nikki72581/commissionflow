# Error Handling

Understanding and handling API errors effectively is crucial for building robust integrations.

## Error Response Format

All error responses follow this consistent format:

```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional context
    }
  }
}
```

## Error Types

### VALIDATION_ERROR (400)

Returned when request body or parameters fail validation.

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["amount"],
        "message": "Amount must be greater than 0"
      },
      {
        "path": ["userId"],
        "message": "Salesperson is required"
      }
    ]
  }
}
```

**Common causes:**
- Missing required fields
- Invalid data types
- Values out of range
- Invalid enum values

**How to fix:**
- Check the `details` array for specific validation errors
- Ensure all required fields are provided
- Verify data types match the API specification

---

### BAD_REQUEST (400)

Returned when the request cannot be processed due to business logic constraints.

```json
{
  "error": {
    "type": "BAD_REQUEST",
    "message": "Cannot delete transaction with paid commissions"
  }
}
```

**Common causes:**
- Attempting to delete resources with dependencies
- Invalid state transitions
- Business rule violations

**How to fix:**
- Read the error message carefully
- Check resource dependencies
- Ensure operation is valid for current state

---

### UNAUTHORIZED (401)

Returned when authentication fails or is missing.

```json
{
  "error": {
    "type": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>"
  }
}
```

```json
{
  "error": {
    "type": "UNAUTHORIZED",
    "message": "Invalid or expired API key"
  }
}
```

**Common causes:**
- Missing `Authorization` header
- Invalid API key format
- Expired API key
- Revoked API key

**How to fix:**
- Verify the `Authorization` header is present
- Check the API key format: `Bearer cf_live_...`
- Ensure the API key hasn't been revoked or expired
- Generate a new API key if needed

---

### FORBIDDEN (403)

Returned when the API key lacks required permissions.

```json
{
  "error": {
    "type": "FORBIDDEN",
    "message": "Missing required scope: sales:write"
  }
}
```

```json
{
  "error": {
    "type": "FORBIDDEN",
    "message": "IP address not whitelisted"
  }
}
```

**Common causes:**
- API key missing required scope
- IP address not in whitelist (if configured)

**How to fix:**
- Check the required scope for the endpoint
- Create a new API key with appropriate scopes
- Verify your IP address is whitelisted (if applicable)

---

### NOT_FOUND (404)

Returned when the requested resource doesn't exist.

```json
{
  "error": {
    "type": "NOT_FOUND",
    "message": "Sales transaction not found"
  }
}
```

**Common causes:**
- Invalid resource ID
- Resource belongs to different organization
- Resource has been deleted

**How to fix:**
- Verify the resource ID is correct
- Ensure you're using the right API key (organization)
- Check if the resource was deleted

---

### RATE_LIMIT_EXCEEDED (429)

Returned when rate limit is exceeded.

```json
{
  "error": {
    "type": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 1000,
      "resetAt": "2024-01-15T15:00:00Z"
    }
  }
}
```

**Response headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-15T15:00:00Z
```

**How to fix:**
- Wait until the reset time before making more requests
- Implement exponential backoff
- Request a higher rate limit if needed
- Batch operations when possible

---

### INTERNAL_ERROR (500)

Returned when an unexpected server error occurs.

```json
{
  "error": {
    "type": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**How to fix:**
- Retry the request with exponential backoff
- If the error persists, contact support
- Check our status page for ongoing issues

---

## Error Handling Best Practices

### 1. Always Check Status Codes

```javascript
const response = await fetch('https://app.commissionflow.com/api/v1/sales', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})

if (!response.ok) {
  const error = await response.json()
  console.error('API Error:', error.error.type, error.error.message)
  // Handle error appropriately
}

const result = await response.json()
```

### 2. Implement Retry Logic

For transient errors (500, 429), implement exponential backoff:

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.ok) {
        return await response.json()
      }

      // Retry on 500 or 429
      if (response.status === 500 || response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Don't retry on client errors (4xx except 429)
      throw new Error(`API error: ${response.status}`)
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
    }
  }
}
```

### 3. Handle Validation Errors

```javascript
if (error.error.type === 'VALIDATION_ERROR') {
  error.error.details.forEach(detail => {
    console.error(`Field ${detail.path.join('.')}: ${detail.message}`)
    // Display error to user or log for debugging
  })
}
```

### 4. Monitor Rate Limits

```javascript
const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
const rateLimitReset = response.headers.get('X-RateLimit-Reset')

if (parseInt(rateLimitRemaining) < 10) {
  console.warn('Approaching rate limit. Consider slowing down requests.')
}
```

### 5. Log Errors

Always log errors with context for debugging:

```javascript
console.error('API request failed', {
  endpoint: url,
  method: options.method,
  statusCode: response.status,
  error: error.error,
  timestamp: new Date().toISOString()
})
```

---

## Common Scenarios

### Scenario 1: Creating a Sale for Non-Existent Project

**Request:**
```bash
POST /api/v1/sales
{
  "amount": 1000,
  "transactionDate": "2024-01-15",
  "userId": "user_123",
  "projectId": "invalid_project_id"
}
```

**Response:** 500 Internal Error
```json
{
  "error": {
    "type": "INTERNAL_ERROR",
    "message": "Project not found"
  }
}
```

**Solution**: Verify the project exists first or use a valid project ID.

---

### Scenario 2: Missing Required Scope

**Request:**
```bash
POST /api/v1/sales
Authorization: Bearer cf_live_key_with_only_read_scope
```

**Response:** 403 Forbidden
```json
{
  "error": {
    "type": "FORBIDDEN",
    "message": "Missing required scope: sales:write"
  }
}
```

**Solution**: Create a new API key with `sales:write` scope.

---

### Scenario 3: Rate Limit Exceeded

After 1000 requests in an hour:

**Response:** 429 Too Many Requests
```json
{
  "error": {
    "type": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 1000,
      "resetAt": "2024-01-15T15:00:00Z"
    }
  }
}
```

**Solution**: Wait until the reset time or implement request throttling.

---

## Getting Help

If you encounter persistent errors or need assistance:

1. Check the [API Documentation](./getting-started.md)
2. Review your API key scopes and permissions
3. Verify your request format matches the examples
4. Contact support with:
   - Error type and message
   - Request details (endpoint, method, body)
   - Timestamp of the error
   - Your organization ID

## See Also

- [Getting Started](./getting-started.md)
- [Sales Transactions API](./sales-transactions.md)
- [Rate Limits](./rate-limits.md)
