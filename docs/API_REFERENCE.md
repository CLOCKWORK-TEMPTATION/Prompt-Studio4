# Prompt Studio 4 - API Reference

> **Base URL**: `http://localhost:3001/api` (Development)
> **Version**: 4.0
> **Format**: REST API with JSON

---

## Authentication

### Session-based API Key

Most AI-related endpoints require an API key. Set it via session:

```bash
# Set API key for session
curl -X POST http://localhost:3001/api/session/api-key \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-groq-api-key"}'

# Check API key status
curl http://localhost:3001/api/session/api-key/status

# Clear API key
curl -X DELETE http://localhost:3001/api/session/api-key
```

---

## Endpoints Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Health | `/health` | System health check |
| Templates | `/templates` | Prompt templates CRUD |
| Techniques | `/techniques` | Prompt techniques CRUD |
| Runs | `/runs` | Execution history |
| AI | `/ai/run`, `/ai/critique` | AI execution |
| Agents | `/agents/compose` | Tri-Agent Composer |
| Cache | `/cache/*` | Semantic caching |
| SDK | `/sdk/*` | SDK generation |
| Collaboration | `/collaboration/*` | Real-time collaboration |
| Deployment | `/deploy/*` | Cloud deployment |

---

## Health Check

### GET /api/health

Check if the server is running and healthy.

**Response** `200 OK`
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2024-12-22T10:30:00.000Z"
}
```

---

## Templates

### GET /api/templates

Get all templates with optional search.

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search in name, description, category |

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Customer Support Bot",
    "description": "A helpful customer service assistant",
    "category": "customer-service",
    "tags": ["support", "chatbot"],
    "sections": {
      "system": "You are a helpful customer service assistant...",
      "developer": "Handle inquiries professionally...",
      "user": "{{user_query}}",
      "context": "Company: {{company_name}}"
    },
    "defaultVariables": [
      { "id": "1", "name": "company_name", "value": "Acme Inc" },
      { "id": "2", "name": "user_query", "value": "" }
    ],
    "createdAt": "2024-12-22T10:00:00.000Z"
  }
]
```

---

### GET /api/templates/:id

Get a specific template by ID.

**Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Template ID |

**Response** `200 OK`
```json
{
  "id": 1,
  "name": "Customer Support Bot",
  "description": "A helpful customer service assistant",
  "category": "customer-service",
  "tags": ["support", "chatbot"],
  "sections": {
    "system": "You are a helpful customer service assistant...",
    "developer": "Handle inquiries professionally...",
    "user": "{{user_query}}",
    "context": "Company: {{company_name}}"
  },
  "defaultVariables": [
    { "id": "1", "name": "company_name", "value": "Acme Inc" }
  ],
  "createdAt": "2024-12-22T10:00:00.000Z"
}
```

**Error Responses**
- `404 Not Found` - Template not found

---

### POST /api/templates

Create a new template.

**Request Body**
```json
{
  "name": "New Template",
  "description": "Template description",
  "category": "general",
  "tags": ["tag1", "tag2"],
  "sections": {
    "system": "System prompt content",
    "developer": "Developer instructions",
    "user": "User message template",
    "context": "Context information"
  },
  "defaultVariables": [
    { "id": "uuid", "name": "variable_name", "value": "default_value" }
  ]
}
```

**Response** `201 Created`
```json
{
  "id": 2,
  "name": "New Template",
  "description": "Template description",
  "category": "general",
  "tags": ["tag1", "tag2"],
  "sections": {...},
  "defaultVariables": [...],
  "createdAt": "2024-12-22T10:00:00.000Z"
}
```

**Error Responses**
- `400 Bad Request` - Validation error

---

### PUT /api/templates/:id

Update an existing template.

**Request Body** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response** `200 OK` - Returns updated template

**Error Responses**
- `400 Bad Request` - Validation error
- `404 Not Found` - Template not found

---

### DELETE /api/templates/:id

Delete a template.

**Response** `204 No Content`

**Error Responses**
- `404 Not Found` - Template not found

---

## Techniques

### GET /api/techniques

Get all prompt engineering techniques.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Chain of Thought",
    "description": "Guide the model to think step by step",
    "goodExample": "Let's solve this step by step:\n1. First...",
    "badExample": "Just give me the answer",
    "commonMistakes": [
      "Not providing enough steps",
      "Skipping intermediate reasoning"
    ],
    "snippet": "Let's approach this step by step:\n1. ",
    "createdAt": "2024-12-22T10:00:00.000Z"
  }
]
```

---

### GET /api/techniques/:id

Get a specific technique by ID.

**Response** `200 OK` - Returns technique object

**Error Responses**
- `404 Not Found` - Technique not found

---

### POST /api/techniques

Create a new technique.

**Request Body**
```json
{
  "title": "Role Playing",
  "description": "Assign a specific role to the AI",
  "goodExample": "You are an expert data scientist...",
  "badExample": "Help me with data",
  "commonMistakes": ["Vague role definition"],
  "snippet": "You are an expert {{role}} with..."
}
```

**Response** `201 Created`

---

### PUT /api/techniques/:id

Update a technique.

**Response** `200 OK` - Returns updated technique

---

### DELETE /api/techniques/:id

Delete a technique.

**Response** `204 No Content`

---

## Runs

### GET /api/runs

Get execution history.

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 100 | Max results |

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "promptVersionId": "uuid",
    "sections": {
      "system": "...",
      "developer": "...",
      "user": "...",
      "context": "..."
    },
    "variables": [{ "id": "1", "name": "var", "value": "val" }],
    "model": "llama-3.3-70b-versatile",
    "temperature": 70,
    "maxTokens": 1000,
    "output": "AI response...",
    "latency": 1234,
    "tokenUsage": {
      "prompt": 100,
      "completion": 200,
      "total": 300
    },
    "createdAt": "2024-12-22T10:00:00.000Z"
  }
]
```

---

### GET /api/runs/:id

Get a specific run.

**Response** `200 OK` - Returns run object

---

## Run Ratings

### GET /api/runs/:runId/rating

Get rating for a run.

**Response** `200 OK`
```json
{
  "id": 1,
  "runId": 1,
  "rating": 4,
  "notes": "Good response but could be more concise",
  "tags": ["accurate", "verbose"],
  "createdAt": "2024-12-22T10:00:00.000Z"
}
```

---

### POST /api/runs/:runId/rating

Create a rating for a run.

**Request Body**
```json
{
  "rating": 5,
  "notes": "Perfect response",
  "tags": ["accurate", "helpful"]
}
```

**Response** `201 Created`

---

### PUT /api/runs/:runId/rating/:id

Update a rating.

**Response** `200 OK`

---

## AI Endpoints

### POST /api/ai/run

Execute a prompt against an LLM.

**Request Body**
```json
{
  "sections": {
    "system": "You are a helpful assistant.",
    "developer": "Respond in a professional manner.",
    "user": "What is the capital of France?",
    "context": "The user is a student."
  },
  "variables": [
    { "id": "1", "name": "topic", "value": "geography" }
  ],
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7,
  "maxTokens": 1000,
  "promptVersionId": "optional-uuid"
}
```

**Response** `200 OK`
```json
{
  "runId": 1,
  "output": "The capital of France is Paris.",
  "latency": 1234,
  "tokenUsage": {
    "prompt": 50,
    "completion": 10,
    "total": 60
  }
}
```

**Error Responses**
- `400 Bad Request` - Validation error
- `502 Bad Gateway` - LLM API error
- `503 Service Unavailable` - No API key configured

---

### POST /api/ai/critique

Get AI critique of a prompt.

**Request Body**
```json
{
  "sections": {
    "system": "You are a helpful assistant.",
    "developer": "Be concise.",
    "user": "Help me.",
    "context": ""
  }
}
```

**Response** `200 OK`
```json
{
  "suggestions": [
    "The user prompt is too vague. Consider adding more context.",
    "The system prompt could be more specific about the domain."
  ],
  "score": 65,
  "improvements": {
    "system": "You are a helpful customer service assistant for...",
    "user": "I need help with {{specific_issue}}."
  }
}
```

---

## Agent Compose

### POST /api/agents/compose

Start a Tri-Agent composition process.

**Request Body**
```json
{
  "rawIdea": "I want a chatbot that helps users write better emails",
  "goal": "Improve email writing quality",
  "constraints": "Keep responses under 100 words",
  "outputFormat": "Structured sections",
  "modelConfig": {
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.3,
    "maxTokens": 2000
  }
}
```

**Response** `200 OK`
```json
{
  "runId": 1
}
```

---

### GET /api/agents/compose/:runId

Get composition status and results.

**Response** `200 OK`
```json
{
  "status": "completed",
  "stage": "done",
  "progress": 100,
  "error": null,
  "result": {
    "agent1": {
      "system": "You are an email writing assistant...",
      "developer": "Focus on clarity and professionalism...",
      "user": "{{email_request}}",
      "context": "{{user_preferences}}",
      "variables": [
        { "id": "1", "name": "email_request", "value": "" }
      ],
      "modelHints": "Best with low temperature for consistency"
    },
    "agent2": {
      "criticisms": ["System prompt could be more specific"],
      "alternativePrompt": {...},
      "fixes": ["Added tone specification"]
    },
    "agent3": {
      "finalPrompt": {...},
      "finalVariables": [...],
      "decisionNotes": ["Merged best aspects from both versions"]
    }
  }
}
```

---

## Semantic Cache

### POST /api/cache/lookup

Check cache for similar prompt.

**Request Body**
```json
{
  "prompt": "What is the capital of France?",
  "model": "llama-3.3-70b-versatile"
}
```

**Response** `200 OK`
```json
{
  "hit": true,
  "response": "The capital of France is Paris.",
  "similarity": 0.95,
  "cached_at": "2024-12-22T10:00:00.000Z"
}
```

---

### POST /api/cache/store

Store response in cache.

**Request Body**
```json
{
  "prompt": "What is the capital of France?",
  "response": "The capital of France is Paris.",
  "model": "llama-3.3-70b-versatile",
  "tags": ["geography", "facts"]
}
```

**Response** `200 OK`
```json
{
  "id": "uuid",
  "prompt": "What is the capital of France?",
  "response": "The capital of France is Paris.",
  "model": "llama-3.3-70b-versatile",
  "expiresAt": "2024-12-22T11:00:00.000Z"
}
```

---

### GET /api/cache/config

Get cache configuration.

**Response** `200 OK`
```json
{
  "id": 1,
  "enabled": true,
  "similarityThreshold": 0.85,
  "defaultTTLSeconds": 3600,
  "maxCacheSize": 1000,
  "invalidationRules": [],
  "updatedAt": "2024-12-22T10:00:00.000Z"
}
```

---

### PUT /api/cache/config

Update cache configuration.

**Request Body**
```json
{
  "enabled": true,
  "similarityThreshold": 0.90,
  "defaultTTLSeconds": 7200
}
```

---

### GET /api/cache/analytics

Get cache analytics.

**Response** `200 OK`
```json
{
  "totalEntries": 150,
  "totalHits": 1200,
  "totalMisses": 300,
  "hitRate": 0.80,
  "tokensSaved": 50000,
  "costSaved": 2.50,
  "averageLatencyReduction": 850
}
```

---

### POST /api/cache/invalidate

Invalidate cache entries.

**Request Body**
```json
{
  "pattern": "capital*",
  "tags": ["geography"],
  "all": false
}
```

**Response** `200 OK`
```json
{
  "invalidated": 5
}
```

---

### POST /api/cache/cleanup

Trigger manual cleanup.

**Response** `200 OK`
```json
{
  "cleaned": 10,
  "timestamp": "2024-12-22T10:00:00.000Z"
}
```

---

### GET /api/cache/cleanup/status

Get cleanup scheduler status.

**Response** `200 OK`
```json
{
  "enabled": true,
  "intervalMinutes": 60,
  "lastRun": "2024-12-22T09:00:00.000Z",
  "nextRun": "2024-12-22T10:00:00.000Z",
  "totalCleaned": 100
}
```

---

## SDK Generation

### POST /api/sdk/generate

Generate SDK from a prompt.

**Request Body**
```json
{
  "promptId": "1",
  "language": "typescript",
  "options": {
    "includeTypes": true,
    "includeTests": true,
    "packageName": "my-prompt-sdk"
  }
}
```

**Response** `200 OK`
```json
{
  "language": "typescript",
  "files": [
    {
      "name": "index.ts",
      "content": "export class MyPromptSDK {...}"
    },
    {
      "name": "types.ts",
      "content": "export interface PromptInput {...}"
    }
  ],
  "packageJson": {
    "name": "my-prompt-sdk",
    "version": "1.0.0"
  }
}
```

---

### GET /api/sdk/languages

Get supported SDK languages.

**Response** `200 OK`
```json
{
  "languages": [
    "typescript",
    "python",
    "java",
    "go",
    "ruby",
    "php",
    "csharp",
    "rust"
  ]
}
```

---

### POST /api/sdk/test

Test generated SDK.

**Request Body**
```json
{
  "sdk": {...},
  "promptId": "1"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "compilationPassed": true,
  "executionPassed": true,
  "executionTime": 150,
  "output": "Test output...",
  "errors": []
}
```

---

## Collaboration

### POST /api/collaboration/sessions

Create a new collaboration session.

**Request Body**
```json
{
  "name": "Team Prompt Review",
  "description": "Reviewing customer support prompts",
  "initialContent": "You are a helpful..."
}
```

**Response** `201 Created`
```json
{
  "id": "uuid",
  "name": "Team Prompt Review",
  "description": "Reviewing customer support prompts",
  "createdAt": "2024-12-22T10:00:00.000Z",
  "activeConnections": 0
}
```

---

### GET /api/collaboration/sessions/:sessionId

Get session details.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "content": "Current document content...",
  "stats": {
    "totalEdits": 150,
    "activeUsers": 3,
    "lastActivity": "2024-12-22T10:30:00.000Z"
  }
}
```

---

### GET /api/collaboration/sessions

List all active sessions.

**Response** `200 OK`
```json
[
  {
    "id": "uuid",
    "stats": {
      "totalEdits": 150,
      "activeUsers": 3
    }
  }
]
```

---

## Cloud Deployment

### POST /api/deploy

Deploy a prompt.

**Request Body**
```json
{
  "promptId": "1",
  "config": {
    "platform": "aws-lambda",
    "region": "us-east-1",
    "functionName": "my-prompt-function",
    "memory": 256,
    "timeout": 30
  }
}
```

**Response** `200 OK`
```json
{
  "deploymentId": "uuid",
  "status": "deploying",
  "url": null,
  "createdAt": "2024-12-22T10:00:00.000Z"
}
```

---

### GET /api/deploy/:deploymentId

Get deployment status.

**Response** `200 OK`
```json
{
  "deploymentId": "uuid",
  "status": "active",
  "url": "https://xyz.lambda.aws.com/prompt",
  "platform": "aws-lambda",
  "metrics": {
    "invocations": 1000,
    "avgLatency": 150,
    "errors": 5
  },
  "createdAt": "2024-12-22T10:00:00.000Z",
  "updatedAt": "2024-12-22T10:05:00.000Z"
}
```

---

### GET /api/deploy

List all deployments.

**Response** `200 OK`
```json
[
  {
    "deploymentId": "uuid",
    "promptId": "1",
    "platform": "aws-lambda",
    "status": "active",
    "url": "https://..."
  }
]
```

---

### DELETE /api/deploy/:deploymentId

Delete/undeploy a deployment.

**Response** `204 No Content`

---

### GET /api/deploy/platforms

Get supported platforms.

**Response** `200 OK`
```json
{
  "platforms": [
    {
      "id": "aws-lambda",
      "name": "AWS Lambda",
      "description": "Serverless functions on AWS"
    },
    {
      "id": "gcp-functions",
      "name": "Google Cloud Functions",
      "description": "Serverless functions on GCP"
    },
    {
      "id": "azure-functions",
      "name": "Azure Functions",
      "description": "Serverless functions on Azure"
    },
    {
      "id": "vercel",
      "name": "Vercel Edge Functions",
      "description": "Edge computing on Vercel"
    },
    {
      "id": "cloudflare",
      "name": "Cloudflare Workers",
      "description": "Edge computing on Cloudflare"
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error formats:

### Validation Error (400)
```json
{
  "error": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "Required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "Template not found"
}
```

### Server Error (500)
```json
{
  "error": "Failed to process request"
}
```

### API Error (502)
```json
{
  "error": "API error: Rate limit exceeded"
}
```

### Service Unavailable (503)
```json
{
  "error": "No API key configured",
  "code": "NO_API_KEY"
}
```

---

## Rate Limits

Currently, rate limits are handled by the underlying LLM provider (Groq). The API itself does not impose additional rate limits.

---

## Changelog

### v4.0 (2024-12-22)
- Added Semantic Cache API
- Added SDK Generation API
- Added Collaboration API
- Added Cloud Deployment API
- Added Tri-Agent Composer
- Enhanced Templates with structured sections

---

## Support

For issues and feature requests:
- GitHub: [Prompt-Studio4 Issues](https://github.com/your-org/prompt-studio4/issues)
