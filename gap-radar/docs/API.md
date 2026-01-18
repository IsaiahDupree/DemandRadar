# GapRadar Public API Documentation

## Overview

The GapRadar Public API provides programmatic access to market gap analysis and reports. The API is available to users on Agency+ plans.

## Base URL

```
Production: https://gapradar.com/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the `Authorization` header:

```bash
Authorization: Bearer dr_live_your_api_key_here
```

### Getting an API Key

1. Upgrade to an Agency+ plan
2. Navigate to Settings → API Keys
3. Click "Generate New API Key"
4. Copy the key immediately (it won't be shown again)
5. Store it securely

### Example Request

```bash
curl https://gapradar.com/api/v1/runs \
  -H "Authorization: Bearer dr_live_your_api_key_here"
```

## Rate Limiting

API requests are rate limited based on your subscription plan:

| Plan | Rate Limit |
|------|------------|
| Agency | 100 requests/hour |
| Studio | 500 requests/hour |

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "resetAt": "2024-01-18T12:00:00.000Z"
}
```

## Endpoints

### List Runs

Get all analysis runs for your account.

```
GET /api/v1/runs
```

**Response:**

```json
{
  "runs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "project_id": "660e8400-e29b-41d4-a716-446655440000",
      "niche_query": "AI productivity tools",
      "seed_terms": ["AI", "productivity"],
      "competitors": ["ChatGPT", "Notion AI"],
      "geo": "us",
      "status": "complete",
      "run_type": "deep",
      "started_at": "2024-01-18T10:00:00.000Z",
      "finished_at": "2024-01-18T10:15:00.000Z",
      "created_at": "2024-01-18T09:59:00.000Z"
    }
  ]
}
```

### Create Run

Create a new market analysis run.

```
POST /api/v1/runs
```

**Request Body:**

```json
{
  "nicheQuery": "SaaS marketing tools",
  "seedTerms": ["SaaS", "marketing", "growth"],
  "competitors": ["HubSpot", "Mailchimp"],
  "geo": "us",
  "runType": "deep"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nicheQuery` | string | Yes | The niche or market to analyze |
| `seedTerms` | string[] | No | Optional seed keywords |
| `competitors` | string[] | No | Optional competitor names |
| `geo` | string | No | Geographic market (default: "us") |
| `runType` | "light" \| "deep" | No | Analysis type (default: "deep") |

**Response:**

```json
{
  "run": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "niche_query": "SaaS marketing tools",
    "seed_terms": ["SaaS", "marketing", "growth"],
    "competitors": ["HubSpot", "Mailchimp"],
    "geo": "us",
    "status": "queued",
    "run_type": "deep",
    "created_at": "2024-01-18T10:00:00.000Z"
  },
  "message": "Analysis run created successfully"
}
```

### List Reports

Get all analysis reports (completed runs) with pagination.

```
GET /api/v1/reports?limit=50&offset=0&status=complete
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (1-100, default: 50) |
| `offset` | integer | Pagination offset (default: 0) |
| `status` | string | Filter by status: `queued`, `running`, `complete`, `failed` |

**Response:**

```json
{
  "reports": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "niche_query": "AI productivity tools",
      "status": "complete",
      "finished_at": "2024-01-18T10:15:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Get Report

Get a specific analysis report by ID.

```
GET /api/v1/reports/{id}
```

**Response:**

```json
{
  "report": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "niche_query": "AI productivity tools",
    "seed_terms": ["AI", "productivity"],
    "competitors": ["ChatGPT", "Notion AI"],
    "geo": "us",
    "status": "complete",
    "run_type": "deep",
    "started_at": "2024-01-18T10:00:00.000Z",
    "finished_at": "2024-01-18T10:15:00.000Z",
    "created_at": "2024-01-18T09:59:00.000Z"
  }
}
```

## Error Handling

The API uses standard HTTP status codes:

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (invalid parameters) |
| `401` | Unauthorized (missing or invalid API key) |
| `403` | Forbidden (insufficient permissions or quota) |
| `404` | Not Found |
| `429` | Too Many Requests (rate limit exceeded) |
| `500` | Internal Server Error |

Error responses include a JSON body with an `error` field:

```json
{
  "error": "nicheQuery is required"
}
```

## OpenAPI Specification

The complete API specification is available in OpenAPI 3.0 format:

```bash
curl https://gapradar.com/api/v1/docs
```

You can use this specification with tools like:
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)

## Code Examples

### Python

```python
import requests

API_KEY = "dr_live_your_api_key_here"
BASE_URL = "https://gapradar.com/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create a run
response = requests.post(
    f"{BASE_URL}/runs",
    headers=headers,
    json={
        "nicheQuery": "AI writing assistants",
        "seedTerms": ["AI", "writing", "content"],
        "geo": "us"
    }
)

run = response.json()["run"]
print(f"Created run: {run['id']}")

# Get all runs
response = requests.get(f"{BASE_URL}/runs", headers=headers)
runs = response.json()["runs"]
print(f"Total runs: {len(runs)}")
```

### Node.js

```javascript
const API_KEY = "dr_live_your_api_key_here";
const BASE_URL = "https://gapradar.com/api/v1";

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json"
};

// Create a run
const response = await fetch(`${BASE_URL}/runs`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    nicheQuery: "AI writing assistants",
    seedTerms: ["AI", "writing", "content"],
    geo: "us"
  })
});

const { run } = await response.json();
console.log(`Created run: ${run.id}`);

// Get all runs
const runsResponse = await fetch(`${BASE_URL}/runs`, { headers });
const { runs } = await runsResponse.json();
console.log(`Total runs: ${runs.length}`);
```

### cURL

```bash
# Create a run
curl -X POST https://gapradar.com/api/v1/runs \
  -H "Authorization: Bearer dr_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "nicheQuery": "AI writing assistants",
    "seedTerms": ["AI", "writing", "content"],
    "geo": "us"
  }'

# Get all runs
curl https://gapradar.com/api/v1/runs \
  -H "Authorization: Bearer dr_live_your_api_key_here"

# Get a specific report
curl https://gapradar.com/api/v1/reports/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer dr_live_your_api_key_here"
```

## Best Practices

1. **Store API keys securely**: Never commit API keys to version control or expose them in client-side code.

2. **Handle rate limits**: Implement exponential backoff when you receive `429` responses.

3. **Monitor usage**: Track your API usage using the rate limit headers to avoid hitting limits.

4. **Use webhooks**: Instead of polling for run completion, consider using webhooks (available on Studio+ plans) to get notified when runs complete.

5. **Cache responses**: Cache report data to reduce API calls and improve performance.

6. **Handle errors gracefully**: Always check response status codes and handle errors appropriately.

## Support

For API support:
- Email: support@gapradar.com
- Documentation: https://docs.gapradar.com
- Status page: https://status.gapradar.com

## Changelog

### v1.0.0 (2024-01-18)
- Initial release
- Endpoints: `/runs`, `/reports`, `/reports/{id}`
- API key authentication
- Rate limiting
- OpenAPI 3.0 specification
