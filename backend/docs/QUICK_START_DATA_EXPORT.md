# Quick Start: User Data Export

## For Developers

### Endpoint
```
GET /api/auth/me/export
```

### Authentication
Requires valid session cookie (user must be logged in)

### Quick Test

1. **Start the server:**
   ```bash
   cd backend
   python main.py
   ```

2. **Login and export (Python):**
   ```python
   import requests
   
   session = requests.Session()
   
   # Login
   session.post("http://localhost:8000/api/auth/login", json={
       "email": "your@email.com",
       "password": "yourpassword"
   })
   
   # Export
   response = session.get("http://localhost:8000/api/auth/me/export")
   data = response.json()
   
   print(f"Profile: {data['profile']['full_name']}")
   print(f"Test Attempts: {len(data['test_attempts'])}")
   print(f"Doubts: {len(data['doubts'])}")
   print(f"Videos Watched: {len(data['video_history'])}")
   ```

3. **Or use the manual test script:**
   ```bash
   cd backend/tests
   python manual_test_export.py
   ```

## For Frontend Integration

### React/Next.js Example
```typescript
async function exportUserData() {
  try {
    const response = await fetch('/api/auth/me/export', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const data = await response.json();
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_data_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Export error:', error);
  }
}
```

### Response Structure
```typescript
interface UserDataExport {
  profile: {
    id: string;
    hospital_id: string;
    hospital_name: string;
    full_name: string;
    role: 'doctor' | 'manager';
    is_focal_point: boolean;
    created_at: string;
  };
  test_attempts: Array<{
    id: string;
    lesson_id: string;
    lesson_title: string;
    track_title: string;
    type: 'pre' | 'post';
    score: number;
    answers: Record<string, number>;
    started_at: string;
    completed_at: string;
  }>;
  doubts: Array<{
    id: string;
    lesson_id: string;
    lesson_title: string;
    text: string;
    image_url?: string;
    status: 'pending' | 'answered';
    answer?: string;
    answered_by?: string;
    ai_summary?: string;
    created_at: string;
  }>;
  video_history: Array<{
    lesson_id: string;
    lesson_title: string;
    track_title: string;
    pre_test_completed_at?: string;
    post_test_completed_at: string;
    inferred_watch_date: string;
  }>;
  export_date: string;
}
```

## Common Issues

### 401 Unauthorized
**Problem:** Not authenticated  
**Solution:** Ensure user is logged in and session cookie is sent

### 404 Not Found
**Problem:** User profile not found  
**Solution:** Check if user exists and is not soft-deleted

### Empty Arrays
**Problem:** No data in test_attempts, doubts, or video_history  
**Solution:** This is normal for new users with no activity

## Testing Checklist

- [ ] User can access endpoint when logged in
- [ ] Endpoint returns 401 when not logged in
- [ ] Profile data is correct
- [ ] Test attempts include all user's tests
- [ ] Doubts include all user's doubts
- [ ] Video history is inferred correctly
- [ ] Export date is current timestamp
- [ ] Soft-deleted records are excluded
- [ ] Only user's own data is returned

## Documentation

For complete documentation, see:
- `backend/docs/DATA_EXPORT_ENDPOINT.md` - Full API documentation
- `backend/docs/TASK_28.1_SUMMARY.md` - Implementation summary
