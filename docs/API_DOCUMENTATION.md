# 📚 API Documentation - SL Academy Platform

## 🌐 Base URL

```
Development:  http://localhost:8000
Staging:      https://api-staging.slacademy.com
Production:   https://api.slacademy.com
```

## 🔐 Authentication

All API requests (except login) require authentication via session cookies.

### Session Cookie
- **Name**: `session`
- **Type**: Encrypted (iron-session)
- **Attributes**: `httpOnly`, `secure` (production), `sameSite=lax`
- **Expiration**: 24 hours
- **Refresh**: Automatic on activity

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Tracks](#track-endpoints)
3. [Lessons](#lesson-endpoints)
4. [Questions & Tests](#question-and-test-endpoints)
5. [Doubts](#doubt-endpoints)
6. [Indicators](#indicator-endpoints)
7. [AI Features](#ai-endpoints)
8. [File Upload](#file-upload-endpoints)
9. [Error Codes](#error-codes)

---

## 🔑 Authentication Endpoints

### POST /api/auth/login

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "admin@hospital.com",
  "password": "Admin123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@hospital.com",
    "full_name": "Admin Teste",
    "role": "manager",
    "hospital_id": "uuid",
    "is_focal_point": false
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid email format
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded (5 attempts per 15 min)

**Rate Limit:** 5 requests per 15 minutes

---

### POST /api/auth/logout

Destroy current session.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

Get current user profile.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "admin@hospital.com",
  "full_name": "Admin Teste",
  "role": "manager",
  "hospital_id": "uuid",
  "is_focal_point": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated

---

## 📚 Track Endpoints

### GET /api/tracks

List all tracks for user's hospital.

**Query Parameters:**
- None

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "hospital_id": "uuid",
    "title": "Cardiologia Básica",
    "description": "Introdução aos conceitos de cardiologia",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "lesson_count": 5
  }
]
```

**Errors:**
- `401 Unauthorized`: Not authenticated

---

### POST /api/tracks

Create new track (manager only).

**Request Body:**
```json
{
  "title": "Cardiologia Básica",
  "description": "Introdução aos conceitos de cardiologia"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "hospital_id": "uuid",
  "title": "Cardiologia Básica",
  "description": "Introdução aos conceitos de cardiologia",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not a manager
- `400 Bad Request`: Invalid input

---

### PATCH /api/tracks/{trackId}

Update track (manager only).

**Request Body:**
```json
{
  "title": "Cardiologia Avançada",
  "description": "Conceitos avançados de cardiologia"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "hospital_id": "uuid",
  "title": "Cardiologia Avançada",
  "description": "Conceitos avançados de cardiologia",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not a manager
- `404 Not Found`: Track not found

---

### DELETE /api/tracks/{trackId}

Soft delete track (manager only).

**Response (200 OK):**
```json
{
  "message": "Track deleted successfully"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not a manager
- `404 Not Found`: Track not found

---

## 📖 Lesson Endpoints

### GET /api/tracks/{trackId}/lessons

List all lessons in a track.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "track_id": "uuid",
    "title": "Anatomia do Coração",
    "description": "Estrutura e funcionamento",
    "video_url": "https://youtube.com/watch?v=...",
    "duration_seconds": 600,
    "order": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Track not found

---

### GET /api/lessons/{lessonId}

Get lesson details.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "track_id": "uuid",
  "track_title": "Cardiologia Básica",
  "title": "Anatomia do Coração",
  "description": "Estrutura e funcionamento",
  "video_url": "https://youtube.com/watch?v=...",
  "duration_seconds": 600,
  "order": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Lesson not found

---

### POST /api/lessons

Create new lesson (manager only).

**Request Body:**
```json
{
  "track_id": "uuid",
  "title": "Anatomia do Coração",
  "description": "Estrutura e funcionamento",
  "video_url": "https://youtube.com/watch?v=...",
  "duration_seconds": 600,
  "order": 1
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "track_id": "uuid",
  "title": "Anatomia do Coração",
  "description": "Estrutura e funcionamento",
  "video_url": "https://youtube.com/watch?v=...",
  "duration_seconds": 600,
  "order": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not a manager
- `400 Bad Request`: Invalid input or duplicate order

---

## ❓ Question and Test Endpoints

### GET /api/lessons/{lessonId}/questions

Get questions for a lesson.

**Query Parameters:**
- `type` (optional): `pre` or `post`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "lesson_id": "uuid",
    "type": "pre",
    "text": "Qual é a função do coração?",
    "options": [
      "Bombear sangue",
      "Filtrar sangue",
      "Produzir sangue",
      "Armazenar sangue"
    ]
  }
]
```

**Note:** `correct_option_index` is NOT included in response for security.

**Errors:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Lesson not found

---

### POST /api/test-attempts

Submit test answers.

**Request Body:**
```json
{
  "lesson_id": "uuid",
  "type": "pre",
  "answers": [
    {
      "question_id": "uuid",
      "selected_option_index": 0
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "lesson_id": "uuid",
  "profile_id": "uuid",
  "type": "pre",
  "score": 75.0,
  "answers": [...],
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Missing answers or invalid data
- `429 Too Many Requests`: Rate limit exceeded (20 per hour)

**Rate Limit:** 20 requests per hour

---

## 💬 Doubt Endpoints

### GET /api/doubts

List doubts.

**Query Parameters:**
- `status` (optional): `pending`, `answered`, `archived`
- `lesson_id` (optional): Filter by lesson

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "profile_id": "uuid",
    "lesson_id": "uuid",
    "text": "Como funciona a circulação?",
    "image_url": "https://...",
    "status": "pending",
    "answer": null,
    "answered_by": null,
    "answered_at": null,
    "ai_summary": "Dúvida sobre circulação sanguínea",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Note:** Doctors see only their doubts, managers see all hospital doubts.

**Errors:**
- `401 Unauthorized`: Not authenticated

---

### POST /api/doubts

Create new doubt.

**Request Body:**
```json
{
  "lesson_id": "uuid",
  "text": "Como funciona a circulação?",
  "image_url": "https://..."
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "profile_id": "uuid",
  "lesson_id": "uuid",
  "text": "Como funciona a circulação?",
  "image_url": "https://...",
  "status": "pending",
  "ai_summary": "Dúvida sobre circulação sanguínea",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid input (text too short/long)
- `429 Too Many Requests`: Rate limit exceeded (10 per hour)

**Rate Limit:** 10 requests per hour

---

### PATCH /api/doubts/{doubtId}

Answer doubt (manager only).

**Request Body:**
```json
{
  "answer": "A circulação funciona através do bombeamento do coração..."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "answered",
  "answer": "A circulação funciona...",
  "answered_by": "uuid",
  "answered_at": "2024-01-02T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not a manager
- `404 Not Found`: Doubt not found

---

## 📊 Indicator Endpoints

### GET /api/indicators

List indicators.

**Query Parameters:**
- `category` (optional): Filter by category
- `start_date` (optional): ISO date (YYYY-MM-DD)
- `end_date` (optional): ISO date (YYYY-MM-DD)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "hospital_id": "uuid",
    "name": "Taxa de Infecção",
    "category": "Segurança",
    "value": 2.5,
    "unit": "%",
    "reference_date": "2024-01-01",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Errors:**
- `401 Unauthorized`: Not authenticated

---

### POST /api/indicators/import

Import indicators from CSV/XLSX (manager only).

**Request Body (multipart/form-data):**
```
file: <spreadsheet file>
```

**CSV Format:**
```csv
name,category,value,unit,reference_date
Taxa de Infecção,Segurança,2.5,%,2024-01-01
```

**Response (200 OK):**
```json
{
  "success_count": 10,
  "error_count": 2,
  "errors": [
    {
      "row": 5,
      "error": "Invalid date format"
    }
  ]
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not a manager
- `400 Bad Request`: Invalid file format
- `429 Too Many Requests`: Rate limit exceeded (1 per minute)

**Rate Limit:** 1 request per minute

---

## 🤖 AI Endpoints

### POST /api/ai/recommendations

Generate lesson recommendations based on test performance.

**Request Body:**
```json
{
  "lesson_id": "uuid",
  "pre_test_score": 60.0,
  "post_test_score": 70.0
}
```

**Response (200 OK):**
```json
{
  "recommendations": [
    {
      "lesson_id": "uuid",
      "lesson_title": "Fisiologia Cardíaca",
      "reason": "Complementa o conhecimento sobre anatomia"
    }
  ]
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid scores
- `429 Too Many Requests`: Rate limit exceeded (5 per hour)
- `503 Service Unavailable`: AI service unavailable

**Rate Limit:** 5 requests per hour

---

## 📁 File Upload Endpoints

### POST /api/upload/image

Upload image file.

**Request Body (multipart/form-data):**
```
file: <image file>
```

**Supported Formats:** JPEG, PNG, WebP
**Max Size:** 5 MB

**Response (200 OK):**
```json
{
  "url": "https://supabase.co/storage/v1/object/public/images/..."
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid file type or size

---

### POST /api/upload/spreadsheet

Upload spreadsheet file.

**Request Body (multipart/form-data):**
```
file: <spreadsheet file>
```

**Supported Formats:** CSV, XLSX
**Max Size:** 10 MB
**Max Rows:** 10,000

**Response (200 OK):**
```json
{
  "rows": 100,
  "preview": [
    ["name", "category", "value"],
    ["Taxa de Infecção", "Segurança", "2.5"]
  ]
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid file type, size, or too many rows

---

## ⚠️ Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Not authenticated or session expired |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | External service unavailable |

### Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "field": "Specific field error"
  }
}
```

### Common Error Messages

**Authentication Errors:**
- `"Invalid credentials"` - Wrong email or password
- `"Session expired"` - Session has expired, re-login required
- `"Not authenticated"` - No valid session

**Authorization Errors:**
- `"Insufficient permissions"` - User role doesn't have access
- `"Manager access required"` - Endpoint requires manager role

**Validation Errors:**
- `"Invalid email format"` - Email format is invalid
- `"Text too short"` - Text doesn't meet minimum length
- `"Invalid UUID format"` - ID format is invalid
- `"Missing required field: {field}"` - Required field not provided

**Rate Limit Errors:**
- `"Rate limit exceeded. Try again in {seconds} seconds"` - Too many requests

**Resource Errors:**
- `"Track not found"` - Track doesn't exist or no access
- `"Lesson not found"` - Lesson doesn't exist or no access
- `"Doubt not found"` - Doubt doesn't exist or no access

---

## 🔒 Security Notes

### Multi-Tenant Isolation
- All data is automatically filtered by hospital_id via RLS
- Users can only access data from their own hospital
- Attempting to access other hospital's data returns 404

### Session Security
- Sessions are encrypted with iron-session
- Cookies are httpOnly (not accessible via JavaScript)
- Cookies are secure in production (HTTPS only)
- Sessions expire after 24 hours of inactivity

### Rate Limiting
- Login: 5 attempts per 15 minutes
- Test submissions: 20 per hour
- Doubt submissions: 10 per hour
- Indicator imports: 1 per minute
- AI requests: 5 per hour

### Input Validation
- All inputs are validated and sanitized
- HTML/script tags are stripped from text inputs
- File uploads are validated by type and size
- UUIDs are validated for format

---

## 📞 Support

For API issues or questions:
- Check error messages for specific details
- Review this documentation
- Contact development team

---

**API Version:** 1.0.0
**Last Updated:** March 14, 2026
