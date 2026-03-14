# Quick Start: Consent Management

## What Was Implemented

Task 28.5 implements GDPR-compliant consent management for the SL Academy Platform.

## Quick Setup

### 1. Apply Database Migration

Go to your Supabase project → SQL Editor and run:

```sql
-- Add consent_timestamp to profiles table
ALTER TABLE profiles
ADD COLUMN consent_timestamp TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN profiles.consent_timestamp IS 'Timestamp when user accepted privacy policy and terms of service (GDPR compliance)';
```

### 2. Restart Backend

The backend code has been updated to handle consent. Simply restart your backend server:

```bash
cd backend
python main.py
```

### 3. Test the Implementation

1. **Navigate to login page**: http://localhost:3000/login
2. **Try to login without consent**: You'll see an error
3. **Check the consent checkbox**: Required to proceed
4. **Click the links**: Privacy policy and terms open in new tabs
5. **Complete login**: Consent timestamp is stored

### 4. Verify in Database

Check that consent was recorded:

```sql
SELECT id, email, consent_timestamp 
FROM profiles 
WHERE email = 'your-test-user@example.com';
```

## What Changed

### Frontend
- ✅ Login page now has consent checkbox
- ✅ Privacy policy page at `/privacy`
- ✅ Terms of service page at `/terms`
- ✅ Links open in new tabs
- ✅ Form validation requires consent

### Backend
- ✅ Login endpoint validates consent
- ✅ Consent timestamp stored on first login
- ✅ Consent included in data export
- ✅ Returns 400 if consent not given

### Database
- ✅ New `consent_timestamp` column in profiles table

## Testing

### Manual Test

```bash
# Test without consent (should fail)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "accept_terms": false
  }'

# Test with consent (should succeed)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "accept_terms": true
  }'
```

### Run Tests

```bash
cd backend
python -m pytest tests/test_consent_management.py -v
```

## Requirements Satisfied

- ✅ **27.1**: Collect only necessary data
- ✅ **27.2**: Provide clear privacy policy and terms
- ✅ **27.6**: Obtain explicit consent before login

## Files Changed

### New Files
- `supabase/migrations/002_add_consent_timestamp.sql`
- `frontend/app/privacy/page.tsx`
- `frontend/app/terms/page.tsx`
- `backend/tests/test_consent_management.py`
- `backend/docs/TASK_28.5_CONSENT_MANAGEMENT.md`
- `backend/docs/QUICK_START_CONSENT_MANAGEMENT.md`

### Modified Files
- `frontend/app/login/page.tsx` - Added consent checkbox
- `backend/models/auth.py` - Added accept_terms field
- `backend/api/routes/auth.py` - Added consent validation and storage
- `QUICKSTART.md` - Updated migration list

## Next Steps

1. Apply the database migration
2. Restart backend and frontend
3. Test the login flow
4. Verify consent is stored
5. Review privacy policy and terms (customize if needed)

## Notes

- Consent is required on every login (explicit re-confirmation)
- Consent timestamp is only set once (not overwritten)
- Privacy and terms pages are publicly accessible
- All content is in Portuguese
- Compliant with GDPR and LGPD requirements
