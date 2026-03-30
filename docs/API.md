# EdgeForce CRM — API Specification

**Built by RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059

---

## Base URL

```
Production: https://edgeforce-crm-worker.rickjefferson.workers.dev
Local:      http://localhost:8787
```

---

## Authentication

All API endpoints (except `/api/auth/*`) require a JWT Bearer token.

```
Authorization: Bearer <access_token>
```

**Token Details:**
- Algorithm: HS256
- Expiry: 15 minutes
- Payload: `{ userId, tenantId, role }`

**Response Codes:**
- `401` - Missing or invalid token
- `403` - Token valid but insufficient permissions

---

## Endpoints

### Health & Status

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "EdgeForce CRM API",
  "version": "1.0.0",
  "timestamp": "2026-03-29T12:00:00Z",
  "region": "unknown"
}
```

---

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Smith",
  "companyName": "Acme Corp"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "owner"
  },
  "token": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errors:**
- `400` - Email already registered
- `400` - Validation error

---

#### POST /api/auth/login
Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "owner"
  },
  "token": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errors:**
- `401` - Invalid credentials

---

#### POST /api/auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### POST /api/auth/logout
Logout and invalidate session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Dashboard

#### GET /api/dashboard
Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "stats": {
    "totalContacts": 150,
    "activeDeals": 23,
    "totalDealValue": 125000,
    "wonDealsThisMonth": 5,
    "wonValueThisMonth": 25000,
    "pendingTasks": 12,
    "completedTasksThisWeek": 18
  },
  "pipeline": [
    {
      "stage": "New",
      "count": 8,
      "value": 45000
    },
    {
      "stage": "Qualified",
      "count": 6,
      "value": 35000
    },
    {
      "stage": "Proposal",
      "count": 5,
      "value": 30000
    },
    {
      "stage": "Negotiation",
      "count": 3,
      "value": 15000
    }
  ],
  "recentActivity": [
    {
      "id": "uuid",
      "type": "deal_created",
      "subject": "New deal: TechStart",
      "timestamp": "2026-03-29T10:00:00Z"
    }
  ]
}
```

---

### Contacts

#### GET /api/contacts
List contacts with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name, email, company |
| status | string | Filter by lead_status (new, contacted, qualified, etc.) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john@techstart.io",
      "company": "TechStart Inc",
      "phone": "+1 555-0123",
      "lead_score": 85,
      "lead_status": "qualified",
      "lifecycle_stage": "lead",
      "owner_id": "user-uuid",
      "created_at": "2026-03-28T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

---

#### POST /api/contacts
Create a new contact.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+1 555-0123",
  "company": "Acme Corp",
  "jobTitle": "CTO",
  "website": "https://example.com",
  "industry": "Technology",
  "source": "manual"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "lead_score": 65,
    "lead_status": "new",
    "created_at": "2026-03-29T12:00:00Z"
  }
}
```

---

#### GET /api/contacts/:id
Get a specific contact.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "phone": "+1 555-0123",
    "company": "Acme Corp",
    "job_title": "CTO",
    "lead_score": 85,
    "lead_status": "qualified",
    "lifecycle_stage": "lead",
    "tags": ["enterprise", "hot-lead"],
    "custom_fields": {},
    "notes": "Met at conference 2026",
    "created_at": "2026-03-28T10:00:00Z",
    "updated_at": "2026-03-29T10:00:00Z"
  }
}
```

---

#### PUT /api/contacts/:id
Update a contact.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@newcompany.com",
  "lead_status": "contacted",
  "lead_score": 90
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### DELETE /api/contacts/:id
Delete (archive) a contact.

**Response (200):**
```json
{
  "success": true,
  "message": "Contact archived"
}
```

---

### Deals

#### GET /api/deals
List deals.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| pipelineId | string | Filter by pipeline |
| stage | string | Filter by stage |
| search | string | Search by name |
| page | number | Page number |
| limit | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "TechStart Enterprise Deal",
      "value": 25000,
      "currency": "USD",
      "stage": "Proposal",
      "probability": 60,
      "contact_id": "contact-uuid",
      "contact_name": "John Smith",
      "owner_id": "user-uuid",
      "expected_close_date": "2026-04-15",
      "created_at": "2026-03-20T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### POST /api/deals
Create a deal.

**Request:**
```json
{
  "name": "New Enterprise Deal",
  "pipelineId": "pipeline-uuid",
  "stage": "New",
  "value": 15000,
  "contactId": "contact-uuid",
  "expectedCloseDate": "2026-04-30"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### PUT /api/deals/:id
Update a deal.

**Request:**
```json
{
  "stage": "Qualified",
  "probability": 40,
  "value": 18000
}
```

---

#### PUT /api/deals/:id/stage
Move deal to a new stage.

**Request:**
```json
{
  "stage": "Proposal",
  "probability": 60
}
```

---

### Tasks

#### GET /api/tasks
List tasks.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | pending, in_progress, completed, cancelled |
| priority | string | low, medium, high, urgent |
| assignedTo | string | Filter by assignee |
| dueDate | string | Filter by due date (today, week, overdue) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Follow up with John",
      "description": "Send proposal document",
      "type": "task",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-03-30",
      "assigned_to": "user-uuid",
      "contact_id": "contact-uuid",
      "deal_id": "deal-uuid",
      "completed": false,
      "created_at": "2026-03-28T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### POST /api/tasks
Create a task.

**Request:**
```json
{
  "title": "Schedule demo call",
  "description": "Use Calendly link",
  "type": "meeting",
  "priority": "medium",
  "dueDate": "2026-03-31",
  "assignedTo": "user-uuid",
  "contactId": "contact-uuid"
}
```

---

#### PUT /api/tasks/:id
Update a task.

---

#### PUT /api/tasks/:id/complete
Mark task as complete.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "completed_at": "2026-03-29T12:00:00Z"
  }
}
```

---

### Pipelines

#### GET /api/pipelines
List pipelines.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sales Pipeline",
      "description": "Main sales process",
      "stages": [
        { "id": "1", "name": "New", "probability": 10 },
        { "id": "2", "name": "Qualified", "probability": 25 },
        { "id": "3", "name": "Proposal", "probability": 50 },
        { "id": "4", "name": "Negotiation", "probability": 75 },
        { "id": "5", "name": "Closed Won", "probability": 100 },
        { "id": "6", "name": "Closed Lost", "probability": 0 }
      ],
      "is_default": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/pipelines
Create a pipeline.

**Request:**
```json
{
  "name": "Enterprise Sales",
  "description": "For large deals",
  "stages": [
    { "name": "Discovery", "probability": 10 },
    { "name": "Demo", "probability": 25 },
    { "name": "Proposal", "probability": 50 },
    { "name": "Negotiation", "probability": 75 },
    { "name": "Won", "probability": 100 }
  ],
  "isDefault": false
}
```

---

### Analytics

#### GET /api/analytics/overview
Get analytics overview.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "metrics": {
      "contacts_added": 45,
      "deals_created": 12,
      "deals_won": 5,
      "revenue": 35000,
      "tasks_completed": 89,
      "email_sent": 156
    },
    "charts": {
      "pipeline_value": [...],
      "lead_score_distribution": [...],
      "activity_timeline": [...]
    }
  }
}
```

---

### AI Features

#### POST /api/ai/score-lead
Score a contact using AI.

**Request:**
```json
{
  "contactId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contactId": "uuid",
    "score": 87,
    "factors": [
      { "name": "Company size", "impact": "positive", "score": 15 },
      { "name": "Email domain", "impact": "positive", "score": 10 },
      { "name": "Job title", "impact": "positive", "score": 8 }
    ],
    "recommendation": "High priority - Schedule demo this week"
  }
}
```

---

#### POST /api/ai/analyze-contact
Get AI insights for a contact.

**Request:**
```json
{
  "contactId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "engagement",
        "message": "Contact has opened 3 emails in the past week"
      },
      {
        "type": "best_time",
        "message": "Best time to contact: Tuesday 10-11 AM"
      },
      {
        "type": "suggestion",
        "message": "Consider sending case study for their industry"
      }
    ]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal error |

---

## Rate Limits

| Tier | Requests | Window |
|------|----------|--------|
| Free | 100 | per minute |
| Starter | 500 | per minute |
| Pro | 2000 | per minute |
| Enterprise | 10000 | per minute |

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1711712400
```

---

*Document Version: 1.0.0 | Generated: 2026-03-29*
*API Base: https://edgeforce-crm-worker.rickjefferson.workers.dev*