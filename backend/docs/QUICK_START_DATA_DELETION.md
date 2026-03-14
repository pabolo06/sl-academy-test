# Quick Start: User Data Deletion

## Overview

This guide provides a quick reference for implementing and using the user data deletion endpoint.

## Endpoint

```
DELETE /api/auth/me
```

## Quick Test

### 1. Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  -c cookies.txt
```

### 2. Export Data (Optional)
```bash
curl -X GET "http://localhost:8000/api/auth/me/export" \
  -b cookies.txt \
  -o my_data.json
```

### 3. Delete Account
```bash
curl -X DELETE "http://localhost:8000/api/auth/me" \
  -b cookies.txt
```

### 4. Verify Deletion
```bash
# Try to login again (should fail)
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## Response

```json
{
  "success": true,
  "message": "Account and all personal data have been permanently deleted",
  "deleted": {
    "test_attempts": 15,
    "doubts": 8,
    "doubts_anonymized": 3
  }
}
```

## What Gets Deleted

✅ Test attempts (all scores and answers)
✅ Doubts submitted (all questions)
✅ User profile (name, role, etc.)
✅ Auth user (email, password)
✅ Session (logged out immediately)
✅ Video watch history (anonymized)

## What Gets Preserved

✅ Hospital data (tracks, lessons, indicators)
✅ Doubts answered by user (anonymized)
✅ Audit logs (for compliance)
✅ Other users' data

## Frontend Integration

### React Example

```jsx
const handleDeleteAccount = async () => {
  if (!confirm('Delete account? This is IRREVERSIBLE!')) return;
  
  try {
    const response = await fetch('/api/auth/me', {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    alert('Account deleted successfully');
    window.location.href = '/goodbye';
  } catch (error) {
    alert('Error deleting account');
  }
};
```

### Vue Example

```vue
<script setup>
const deleteAccount = async () => {
  if (!confirm('Delete account? This is IRREVERSIBLE!')) return;
  
  try {
    const response = await fetch('/api/auth/me', {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    alert('Account deleted successfully');
    router.push('/goodbye');
  } catch (error) {
    alert('Error deleting account');
  }
};
</script>
```

## Testing

```bash
# Run tests
cd backend
pytest tests/test_user_deletion.py -v

# Run with coverage
pytest tests/test_user_deletion.py --cov=api.routes.auth --cov-report=html
```

## Security Notes

⚠️ **Authentication Required:** Must be logged in
⚠️ **Irreversible:** Cannot undo deletion
⚠️ **Immediate Effect:** Session destroyed immediately
⚠️ **Audit Logged:** Deletion is logged for compliance

## GDPR Compliance

✅ Article 17: Right to Erasure (Right to be Forgotten)
✅ Permanent deletion of personal data
✅ Anonymization of retained data
✅ Audit trail maintained

## Common Issues

### Issue: "Not authenticated"
**Solution:** Ensure session cookie is included in request

### Issue: "An error occurred during account deletion"
**Solution:** Check database connection and logs

### Issue: Auth user not deleted
**Solution:** Check Supabase service role key permissions

## Documentation

- Full API docs: `backend/docs/DATA_DELETION_ENDPOINT.md`
- Task summary: `backend/docs/TASK_28.3_SUMMARY.md`
- Data export: `backend/docs/DATA_EXPORT_ENDPOINT.md`

## Support

For issues or questions:
1. Check audit logs for deletion confirmation
2. Review error logs in backend
3. Contact system administrator
