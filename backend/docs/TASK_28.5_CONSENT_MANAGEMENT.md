# Task 28.5: Consent Management Implementation

## Overview

This task implements GDPR-compliant consent management for the SL Academy Platform, including:
- Privacy policy and terms of service pages
- Consent checkbox in login flow
- Consent timestamp storage in database
- Consent data in user data export

## Changes Made

### 1. Database Migration

**File**: `supabase/migrations/002_add_consent_timestamp.sql`

Added `consent_timestamp` column to the `profiles` table to track when users accept the privacy policy and terms of service.

**To apply this migration**:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and execute `supabase/migrations/002_add_consent_timestamp.sql`

### 2. Frontend Changes

#### Privacy Policy Page
**File**: `frontend/app/privacy/page.tsx`

Created a comprehensive privacy policy page in Portuguese covering:
- Data collection practices
- Data usage and sharing
- Security measures
- User rights (GDPR/LGPD)
- Data retention policies
- Cookie usage
- Contact information

#### Terms of Service Page
**File**: `frontend/app/terms/page.tsx`

Created terms of service page covering:
- Service description
- User account responsibilities
- Acceptable use policy
- Intellectual property
- Privacy policy reference
- Service availability
- Liability limitations
- Termination conditions

#### Login Page Updates
**File**: `frontend/app/login/page.tsx`

Added consent checkbox to login form:
- Required checkbox for accepting terms and privacy policy
- Links to privacy policy and terms pages (open in new tab)
- Form validation to ensure consent is given
- Error message if user tries to login without accepting

### 3. Backend Changes

#### Auth Models
**File**: `backend/models/auth.py`

Updated `LoginRequest` model to include:
- `accept_terms` field (boolean, required)

#### Auth Routes
**File**: `backend/api/routes/auth.py`

Updated login endpoint to:
1. Validate that `accept_terms` is true
2. Check if user has already consented (consent_timestamp exists)
3. Store consent timestamp on first login or re-consent
4. Return 400 error if consent is not given

Updated data export endpoint to:
- Include `consent_timestamp` in exported profile data

## Requirements Satisfied

This implementation satisfies the following requirements from Requirement 27:

- **27.1**: System collects only necessary personal data ✅
- **27.2**: System provides clear privacy policy and terms of service ✅
- **27.6**: System obtains explicit consent before account creation/login ✅

## Testing

### Manual Testing Steps

1. **Apply Database Migration**
   ```sql
   -- Execute in Supabase SQL Editor
   ALTER TABLE profiles ADD COLUMN consent_timestamp TIMESTAMP WITH TIME ZONE;
   ```

2. **Test Login Flow**
   - Navigate to http://localhost:3000/login
   - Try to login without checking the consent checkbox
   - Verify error message appears
   - Check the consent checkbox
   - Verify links to privacy and terms pages work
   - Complete login successfully

3. **Verify Consent Storage**
   ```sql
   -- Check in Supabase Table Editor
   SELECT id, email, consent_timestamp FROM profiles WHERE email = 'test@example.com';
   ```
   - Verify `consent_timestamp` is set after first login

4. **Test Privacy Policy Page**
   - Navigate to http://localhost:3000/privacy
   - Verify all sections are displayed correctly
   - Verify page is accessible without authentication

5. **Test Terms of Service Page**
   - Navigate to http://localhost:3000/terms
   - Verify all sections are displayed correctly
   - Verify link to privacy policy works

6. **Test Data Export**
   - Login as a user
   - Call GET /api/auth/me/export
   - Verify `consent_timestamp` is included in profile data

### Backend API Testing

```bash
# Test login without consent
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "accept_terms": false
  }'
# Expected: 400 Bad Request

# Test login with consent
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "accept_terms": true
  }'
# Expected: 200 OK with session cookie
```

## User Flow

### First-Time Login
1. User navigates to login page
2. User enters email and password
3. User must check "I accept the Terms of Service and Privacy Policy"
4. User can click links to read full terms/privacy policy (opens in new tab)
5. User submits login form
6. Backend validates consent is given
7. Backend stores consent timestamp in database
8. User is logged in and redirected to dashboard

### Subsequent Logins
1. User navigates to login page
2. User enters email and password
3. User must check consent checkbox (even if previously consented)
4. User submits login form
5. Backend validates consent is given
6. Backend checks if consent_timestamp already exists (doesn't overwrite)
7. User is logged in and redirected to dashboard

## Notes

- Consent is required on every login for explicit re-confirmation
- Consent timestamp is only set once (first time user consents)
- Privacy policy and terms pages are publicly accessible (no authentication required)
- Both pages are in Portuguese to match the platform's language
- Links open in new tabs to prevent losing login form data
- Consent data is included in GDPR data export

## Future Enhancements

Potential improvements for future iterations:
1. Add consent version tracking (track which version of terms user accepted)
2. Add notification when terms are updated
3. Add ability to revoke consent (triggers account deletion)
4. Add consent audit log (track all consent events)
5. Add email notification when user first consents
6. Add admin dashboard to view consent statistics

## Compliance Notes

This implementation helps satisfy:
- **GDPR Article 7**: Conditions for consent
- **GDPR Article 13**: Information to be provided
- **GDPR Article 15**: Right of access (via data export)
- **LGPD Article 8**: Consent requirements
- **LGPD Article 9**: Consent format

The implementation provides:
- ✅ Clear and specific consent request
- ✅ Freely given consent (checkbox, not pre-checked)
- ✅ Informed consent (links to full terms and privacy policy)
- ✅ Documented consent (timestamp stored)
- ✅ Accessible privacy information
- ✅ Right to access consent data (via export)
