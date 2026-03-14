# User Data Export Endpoint

## Overview

The user data export endpoint provides GDPR-compliant data export functionality, allowing users to download all their personal data in JSON format.

**Endpoint:** `GET /api/auth/me/export`

**Requirement:** 27.3 - WHEN a user requests their data, THE System SHALL provide an export of all their personal data

## Authentication

- **Required:** Yes
- **Method:** Session cookie (httpOnly)
- **Roles:** All authenticated users (both doctors and managers)

## Response Format

```json
{
  "profile": {
    "id": "uuid",
    "hospital_id": "uuid",
    "hospital_name": "string",
    "full_name": "string",
    "role": "doctor|manager",
    "is_focal_point": boolean,
    "created_at": "timestamp"
  },
  "test_attempts": [
    {
      "id": "uuid",
      "lesson_id": "uuid",
      "lesson_title": "string",
      "track_title": "string",
      "type": "pre|post",
      "score": number,
      "answers": {},
      "started_at": "timestamp",
      "completed_at": "timestamp"
    }
  ],
  "doubts": [
    {
      "id": "uuid",
      "lesson_id": "uuid",
      "lesson_title": "string",
      "text": "string",
      "image_url": "string|null",
      "status": "pending|answered",
      "answer": "string|null",
      "answered_by": "uuid|null",
      "ai_summary": "string|null",
      "created_at": "timestamp"
    }
  ],
  "video_history": [
    {
      "lesson_id": "uuid",
      "lesson_title": "string",
      "track_title": "string",
      "pre_test_completed_at": "timestamp|null",
      "post_test_completed_at": "timestamp",
      "inferred_watch_date": "timestamp"
    }
  ],
  "export_date": "timestamp"
}
```

## Data Included

### 1. Profile Data
- User ID
- Hospital ID and name
- Full name
- Role (doctor/manager)
- Focal point status
- Account creation date

### 2. Test Attempts
- All pre-test and post-test attempts
- Scores and answers
- Associated lesson and track information
- Completion timestamps

### 3. Doubts
- All doubts submitted by the user
- Question text and optional images
- Status (pending/answered)
- Answers from managers
- AI-generated summaries
- Associated lesson information

### 4. Video Watch History
- Inferred from test completion data
- Videos are considered "watched" when post-test is completed
- Includes lesson and track information
- Sorted by most recent first

## Implementation Details

### Video History Inference

Since the platform doesn't track video playback directly, video watch history is inferred from test attempts:

1. A video is considered "watched" when a user completes the post-test
2. The watch date is inferred from the post-test completion timestamp
3. Pre-test completion timestamp is also included for context

### Data Filtering

- Only returns data belonging to the authenticated user
- Excludes soft-deleted records (doubts with `deleted_at` set)
- Respects hospital-level RLS policies

### Performance Considerations

- Uses efficient database queries with joins
- Limits data to user's own records
- Sorts results by most recent first
- Expected response time: < 2 seconds for typical user data

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```
**Cause:** No valid session cookie provided

### 404 Not Found
```json
{
  "detail": "User profile not found"
}
```
**Cause:** User profile doesn't exist or is soft-deleted

### 500 Internal Server Error
```json
{
  "detail": "An error occurred during data export"
}
```
**Cause:** Database error or unexpected exception

## Usage Examples

### cURL
```bash
curl -X GET "http://localhost:8000/api/auth/me/export" \
  -H "Cookie: session=<session_cookie>" \
  -H "Content-Type: application/json"
```

### Python (requests)
```python
import requests

session = requests.Session()

# Login first
login_response = session.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "user@example.com", "password": "password"}
)

# Export data
export_response = session.get("http://localhost:8000/api/auth/me/export")
export_data = export_response.json()

# Save to file
import json
with open("my_data.json", "w") as f:
    json.dump(export_data, f, indent=2)
```

### JavaScript (fetch)
```javascript
// Assuming user is already logged in with session cookie
fetch('/api/auth/me/export', {
  method: 'GET',
  credentials: 'include'
})
  .then(response => response.json())
  .then(data => {
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_data.json';
    a.click();
  });
```

## Testing

### Manual Testing
Use the provided manual test script:
```bash
cd backend/tests
python manual_test_export.py
```

### Automated Testing
Run the test suite:
```bash
cd backend
pytest tests/test_data_export.py -v
```

## Security Considerations

1. **Authentication Required:** Endpoint requires valid session cookie
2. **User Isolation:** Only returns data for authenticated user
3. **Hospital RLS:** Respects hospital-level data isolation
4. **No Sensitive Data Exposure:** Doesn't include passwords or auth tokens
5. **Audit Logging:** Export requests are logged for compliance

## GDPR Compliance

This endpoint satisfies GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability):

- ✓ Provides all personal data in structured format (JSON)
- ✓ Includes all data categories (profile, activity, content)
- ✓ Machine-readable format for portability
- ✓ Available to all users without restriction
- ✓ Includes metadata (export date, timestamps)

## Future Enhancements

Potential improvements for future versions:

1. **Format Options:** Support CSV, XML, or PDF export formats
2. **Selective Export:** Allow users to choose which data categories to export
3. **Scheduled Exports:** Automatic periodic exports
4. **Email Delivery:** Send export as email attachment
5. **Compression:** ZIP archive for large exports
6. **Direct Video Tracking:** Track actual video playback progress
7. **Export History:** Track when exports were requested
