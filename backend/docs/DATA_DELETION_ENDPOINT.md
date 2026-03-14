# User Data Deletion Endpoint

## Overview

The user data deletion endpoint provides GDPR-compliant account deletion functionality, allowing users to permanently delete their account and all associated personal data (Right to be Forgotten).

**Endpoint:** `DELETE /api/auth/me`

**Requirements:** 
- 27.4 - WHEN a user requests deletion, THE System SHALL permanently remove their personal data (right to be forgotten)
- 27.7 - THE System SHALL anonymize video watch history after 6 months for analytics purposes

## ⚠️ WARNING

**This action is IRREVERSIBLE.** Once an account is deleted:
- All personal data is permanently removed
- The user cannot log in again with the same credentials
- Data cannot be recovered
- The session is immediately terminated

## Authentication

- **Required:** Yes
- **Method:** Session cookie (httpOnly)
- **Roles:** All authenticated users (both doctors and managers)

## Response Format

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

## Data Deletion Process

### 1. Test Attempts (Permanent Deletion)
- **Action:** All test attempts are permanently deleted
- **Includes:** Pre-test and post-test submissions
- **Effect:** Removes all scores, answers, and completion timestamps
- **Rationale:** Personal learning data

### 2. Doubts Submitted (Permanent Deletion)
- **Action:** All doubts created by the user are permanently deleted
- **Includes:** Question text, images, answers, AI summaries
- **Effect:** Removes all doubt records where user is the creator
- **Rationale:** Personal questions and content

### 3. Doubts Answered (Anonymization)
- **Action:** Doubts answered by the user are anonymized
- **Includes:** Setting `answered_by` field to NULL
- **Effect:** Preserves the doubt and answer for the original asker, but removes manager identity
- **Rationale:** Preserve educational value while removing personal attribution

### 4. User Profile (Permanent Deletion)
- **Action:** User profile record is permanently deleted
- **Includes:** Full name, role, focal point status
- **Effect:** Removes profile from database
- **Rationale:** Personal identification data

### 5. Auth User (Permanent Deletion)
- **Action:** Authentication user record is permanently deleted
- **Includes:** Email, password hash, auth metadata
- **Effect:** User cannot log in again
- **Rationale:** Authentication credentials

### 6. Session (Immediate Termination)
- **Action:** Session cookie is destroyed
- **Effect:** User is immediately logged out
- **Rationale:** Security and immediate effect

### 7. Video Watch History (Anonymization)
- **Action:** Video watch history is anonymized by deleting test attempts
- **Effect:** Cannot trace video viewing to specific user
- **Rationale:** Requirement 27.7 - anonymize after 6 months (we do it immediately on deletion)

## Data NOT Deleted

The following data is preserved to maintain system integrity:

### Hospital-Level Data
- **Tracks:** Learning tracks remain available
- **Lessons:** Lesson content and videos remain available
- **Questions:** Test questions remain available
- **Indicators:** Hospital performance metrics remain available

**Rationale:** This data belongs to the hospital, not the individual user

### Audit Logs
- **Deletion Event:** A record of the deletion is logged for compliance
- **Includes:** User ID, email, deletion timestamp, counts of deleted items
- **Rationale:** Legal requirement to maintain audit trail

## Implementation Details

### Deletion Order

The deletion follows a specific order to handle foreign key constraints:

1. Test attempts (references profile)
2. Doubts submitted (references profile)
3. Doubts answered (anonymize, don't delete)
4. User profile (cascades to remaining references)
5. Auth user (final step)
6. Session destruction

### Database Cascading

The database schema uses `ON DELETE CASCADE` for:
- `test_attempts.profile_id` → `profiles.id`
- `doubts.profile_id` → `profiles.id`

And `ON DELETE SET NULL` for:
- `doubts.answered_by` → `profiles.id`

### Error Handling

If auth user deletion fails (e.g., Supabase API error):
- Profile and data are still deleted
- Error is logged but request succeeds
- User cannot log in (profile is gone)
- Manual cleanup may be needed for auth record

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```
**Cause:** No valid session cookie provided

### 500 Internal Server Error
```json
{
  "detail": "An error occurred during account deletion"
}
```
**Cause:** Database error or unexpected exception

## Usage Examples

### cURL
```bash
curl -X DELETE "http://localhost:8000/api/auth/me" \
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

# Optional: Export data first
export_response = session.get("http://localhost:8000/api/auth/me/export")
export_data = export_response.json()

# Delete account (IRREVERSIBLE!)
delete_response = session.delete("http://localhost:8000/api/auth/me")
result = delete_response.json()

print(f"Deleted {result['deleted']['test_attempts']} test attempts")
print(f"Deleted {result['deleted']['doubts']} doubts")
print(f"Anonymized {result['deleted']['doubts_anonymized']} answered doubts")
```

### JavaScript (fetch)
```javascript
// Assuming user is already logged in with session cookie

// Optional: Export data first
const exportData = await fetch('/api/auth/me/export', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json());

// Confirm with user
if (confirm('Are you sure? This action is IRREVERSIBLE!')) {
  const result = await fetch('/api/auth/me', {
    method: 'DELETE',
    credentials: 'include'
  }).then(r => r.json());
  
  console.log('Account deleted:', result);
  // User is now logged out and redirected to login page
}
```

## Frontend Integration

### Recommended User Flow

1. **Warning Page:** Show clear warning about irreversibility
2. **Data Export:** Offer to export data first
3. **Confirmation:** Require explicit confirmation (checkbox + button)
4. **Final Confirmation:** Show modal with "Type DELETE to confirm"
5. **Deletion:** Execute DELETE request
6. **Redirect:** Redirect to goodbye page or login

### Example React Component

```jsx
function DeleteAccountPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      // Show success message
      alert(`Account deleted. ${result.deleted.test_attempts} test attempts and ${result.deleted.doubts} doubts removed.`);
      
      // Redirect to goodbye page
      window.location.href = '/goodbye';
    } catch (error) {
      alert('Error deleting account. Please try again.');
    }
  };
  
  return (
    <div className="delete-account-page">
      <h1>Delete Account</h1>
      
      <div className="warning-box">
        <h2>⚠️ Warning: This action is IRREVERSIBLE</h2>
        <p>Deleting your account will:</p>
        <ul>
          <li>Permanently delete all your test attempts and scores</li>
          <li>Permanently delete all your doubts and questions</li>
          <li>Remove your profile and personal information</li>
          <li>Prevent you from logging in again</li>
        </ul>
        <p><strong>This data CANNOT be recovered.</strong></p>
      </div>
      
      <div className="export-option">
        <p>Before deleting, you may want to:</p>
        <a href="/api/auth/me/export" download>
          Download a copy of your data
        </a>
      </div>
      
      <div className="confirmation">
        <label>
          <input 
            type="checkbox" 
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I understand this action is permanent and irreversible
        </label>
      </div>
      
      <div className="final-confirmation">
        <p>Type <strong>DELETE</strong> to confirm:</p>
        <input 
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
        />
      </div>
      
      <button 
        onClick={handleDelete}
        disabled={!confirmed || confirmText !== 'DELETE'}
        className="delete-button"
      >
        Delete My Account Permanently
      </button>
    </div>
  );
}
```

## Testing

### Manual Testing
```bash
# 1. Create test user
# 2. Create some test data (test attempts, doubts)
# 3. Export data to verify it exists
curl -X GET "http://localhost:8000/api/auth/me/export" \
  -H "Cookie: session=<session_cookie>"

# 4. Delete account
curl -X DELETE "http://localhost:8000/api/auth/me" \
  -H "Cookie: session=<session_cookie>"

# 5. Verify data is deleted
# - Try to login (should fail)
# - Check database for user records (should be gone)
# - Check audit logs (should have deletion event)
```

### Automated Testing
```bash
cd backend
pytest tests/test_user_deletion.py -v
```

## Security Considerations

1. **Authentication Required:** Only authenticated users can delete their own account
2. **No Admin Override:** Admins cannot delete other users' accounts via this endpoint
3. **Immediate Effect:** Session is destroyed immediately
4. **Audit Trail:** Deletion is logged for compliance
5. **No Cascade to Hospital:** Hospital data is preserved
6. **Anonymization:** Manager identities in answered doubts are removed

## GDPR Compliance

This endpoint satisfies GDPR Article 17 (Right to Erasure / Right to be Forgotten):

- ✓ Permanently deletes all personal data
- ✓ Removes data from all systems (database, auth)
- ✓ Anonymizes data that must be retained (answered doubts)
- ✓ Immediate effect (no delay)
- ✓ Audit trail maintained for legal compliance
- ✓ Available to all users without restriction

## Audit Logging

Each deletion creates an audit log entry with:

```json
{
  "event_type": "ACCOUNT_DELETION",
  "event_description": "Account - Permanent Deletion (GDPR)",
  "user_id": "uuid",
  "hospital_id": "uuid",
  "details": {
    "email": "user@example.com",
    "test_attempts_deleted": 15,
    "doubts_deleted": 8,
    "doubts_anonymized": 3,
    "deletion_timestamp": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Multi-Tenant Considerations

### Same Hospital
- User deletion does not affect other users in the same hospital
- Hospital-level data (tracks, lessons, indicators) is preserved
- Other users can continue using the platform normally

### Cross-Hospital
- Deletion only affects the user's own data
- No impact on other hospitals
- RLS policies ensure isolation

## Performance

- **Expected Time:** < 2 seconds for typical user
- **Database Operations:** 5-6 queries (deletes + updates)
- **Blocking:** Synchronous operation (user waits for completion)
- **Optimization:** Uses database cascading for efficiency

## Future Enhancements

Potential improvements for future versions:

1. **Soft Delete Option:** Allow temporary deactivation before permanent deletion
2. **Grace Period:** 30-day grace period before permanent deletion
3. **Partial Deletion:** Allow users to delete specific data categories
4. **Admin Deletion:** Separate endpoint for admin-initiated deletions
5. **Bulk Deletion:** Delete multiple users (admin only)
6. **Scheduled Deletion:** Schedule deletion for future date
7. **Deletion Confirmation Email:** Send confirmation email after deletion
8. **Data Retention Policy:** Automatically delete inactive accounts after X years

## Related Endpoints

- `GET /api/auth/me/export` - Export user data before deletion
- `POST /api/auth/logout` - Logout without deleting account
- `GET /api/auth/me` - Get current user information

## Support

For questions or issues with account deletion:
- Check audit logs for deletion confirmation
- Contact system administrator if data persists
- Review GDPR compliance documentation
