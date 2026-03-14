# Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used in the SL Academy Platform.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Backend Variables](#backend-variables)
- [Frontend Variables](#frontend-variables)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Security Best Practices](#security-best-practices)
- [Setup Instructions](#setup-instructions)

## Overview

The SL Academy Platform uses environment variables to configure both backend (FastAPI) and frontend (Next.js) applications. This approach allows for:

- **Separation of configuration from code**
- **Different settings per environment** (development, staging, production)
- **Secure handling of sensitive credentials**
- **Easy deployment across different platforms**

## File Structure

```
sl-academy-platform/
├── backend/
│   ├── .env                    # Active configuration (gitignored)
│   ├── .env.example            # Template with documentation
│   ├── .env.development        # Development defaults
│   ├── .env.staging            # Staging configuration
│   └── .env.production         # Production configuration
└── frontend/
    ├── .env.local              # Active configuration (gitignored)
    ├── .env.example            # Template with documentation
    ├── .env.development        # Development defaults
    ├── .env.staging            # Staging configuration
    └── .env.production         # Production configuration
```

**Important:** Only `.env.example` files should be committed to version control. All other `.env*` files are gitignored to prevent credential leakage.

## Backend Variables

### Supabase Configuration

#### `SUPABASE_URL`
- **Required:** Yes
- **Type:** URL
- **Description:** Your Supabase project URL
- **Example:** `https://joewhfllvdaygffsosor.supabase.co`
- **Where to find:** Supabase Dashboard → Project Settings → API → Project URL

#### `SUPABASE_ANON_KEY`
- **Required:** Yes
- **Type:** JWT Token
- **Description:** Supabase anonymous key for client-side operations
- **Security:** Safe to expose (RLS protects data)
- **Where to find:** Supabase Dashboard → Project Settings → API → anon/public key

#### `SUPABASE_SERVICE_KEY`
- **Required:** Yes
- **Type:** JWT Token
- **Description:** Supabase service role key for server-side operations
- **Security:** **CRITICAL - KEEP SECRET!** This key bypasses RLS
- **Where to find:** Supabase Dashboard → Project Settings → API → service_role key
- **Warning:** Never expose this key to clients or commit to version control

### Database Configuration

#### `DATABASE_URL`
- **Required:** Yes
- **Type:** PostgreSQL Connection String
- **Format:** `postgresql://user:password@host:port/database`
- **Description:** Direct PostgreSQL connection for database operations
- **Example:** `postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- **Where to find:** Supabase Dashboard → Project Settings → Database → Connection Pooling
- **Note:** Use connection pooler URL for better performance

### API Server Configuration

#### `API_HOST`
- **Required:** Yes
- **Type:** IP Address
- **Default:** `0.0.0.0`
- **Description:** Host to bind the API server
- **Options:**
  - `0.0.0.0` - All network interfaces (recommended for Docker/production)
  - `127.0.0.1` - Localhost only (more secure for local dev)

#### `API_PORT`
- **Required:** Yes
- **Type:** Integer
- **Default:** `8000`
- **Description:** Port for the API server
- **Range:** 1024-65535 (avoid privileged ports < 1024)

#### `API_RELOAD`
- **Required:** No
- **Type:** Boolean
- **Default:** `true` (development), `false` (production)
- **Description:** Enable auto-reload on code changes
- **Warning:** Must be `false` in production

### CORS Configuration

#### `CORS_ORIGINS`
- **Required:** Yes
- **Type:** Comma-separated URLs
- **Description:** Allowed origins for Cross-Origin Resource Sharing
- **Example:** `http://localhost:3000,https://app.slacademy.com`
- **Security:** Only include trusted frontend URLs
- **Development:** `http://localhost:3000,http://localhost:3001`
- **Production:** `https://slacademy.com,https://app.slacademy.com`

### Session Management

#### `SESSION_SECRET_KEY`
- **Required:** Yes
- **Type:** String (32+ characters)
- **Description:** Secret key for encrypting session cookies
- **Security:** **CRITICAL - MUST BE UNIQUE PER ENVIRONMENT**
- **Generation:**
  ```bash
  # Python
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  
  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Warning:** Never reuse keys across environments

#### `SESSION_MAX_AGE`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `86400` (24 hours)
- **Description:** Session expiration time
- **Requirement:** Implements Requirement 1.4 (24-hour session expiration)

### AI Service Configuration

#### `OPENAI_API_KEY`
- **Required:** Yes (for AI features)
- **Type:** API Key
- **Description:** OpenAI API key for AI-powered features
- **Format:** `sk-proj-...` or `sk-...`
- **Where to get:** https://platform.openai.com/api-keys
- **Features:** Doubt summaries, learning recommendations
- **Cost:** Pay-per-use (monitor usage)

#### `AI_MODEL`
- **Required:** No
- **Type:** String
- **Default:** `gpt-4-turbo-preview`
- **Options:**
  - `gpt-4-turbo-preview` - Best quality, higher cost
  - `gpt-4` - High quality, moderate cost
  - `gpt-3.5-turbo` - Good quality, lower cost
- **Recommendation:** Use `gpt-3.5-turbo` for development, `gpt-4-turbo-preview` for production

#### `AI_MAX_TOKENS`
- **Required:** No
- **Type:** Integer
- **Default:** `500`
- **Description:** Maximum tokens for AI responses
- **Range:** 100-2000 (higher = more detailed but more expensive)

#### `AI_TIMEOUT`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `10`
- **Description:** Timeout for AI API requests
- **Requirement:** Implements Requirement 15.7 (3 seconds at p95)

### Rate Limiting Configuration

All rate limiting variables implement Requirement 13 (API Rate Limiting).

#### `RATE_LIMIT_ENABLED`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable/disable rate limiting globally
- **Recommendation:** Always `true` in production

#### Login Rate Limits (Requirement 13.1)
- `RATE_LIMIT_LOGIN`: Default `5` requests
- `RATE_LIMIT_LOGIN_WINDOW`: Default `900` seconds (15 minutes)

#### Test Submission Rate Limits (Requirement 13.2)
- `RATE_LIMIT_TESTS`: Default `20` requests
- `RATE_LIMIT_TESTS_WINDOW`: Default `3600` seconds (1 hour)

#### Doubt Submission Rate Limits (Requirement 13.3)
- `RATE_LIMIT_DOUBTS`: Default `10` requests
- `RATE_LIMIT_DOUBTS_WINDOW`: Default `3600` seconds (1 hour)

#### Indicator Import Rate Limits (Requirement 13.4)
- `RATE_LIMIT_INDICATORS`: Default `1` request
- `RATE_LIMIT_INDICATORS_WINDOW`: Default `60` seconds (1 minute)

#### AI Request Rate Limits (Requirement 13.5)
- `RATE_LIMIT_AI`: Default `5` requests
- `RATE_LIMIT_AI_WINDOW`: Default `3600` seconds (1 hour)

### Environment Configuration

#### `ENVIRONMENT`
- **Required:** Yes
- **Type:** String
- **Options:** `development`, `staging`, `production`
- **Description:** Current environment name
- **Usage:** Affects logging, error handling, security settings

#### `DEBUG`
- **Required:** No
- **Type:** Boolean
- **Default:** `true` (development), `false` (production)
- **Description:** Enable detailed error messages and debug logging
- **Warning:** **MUST be `false` in production** to prevent information leakage

### Logging Configuration

#### `LOG_LEVEL`
- **Required:** No
- **Type:** String
- **Default:** `INFO`
- **Options:** `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Recommendation:**
  - Development: `DEBUG`
  - Staging: `INFO`
  - Production: `WARNING`

#### `LOG_FORMAT`
- **Required:** No
- **Type:** String
- **Default:** `text`
- **Options:** `text`, `json`
- **Recommendation:**
  - Development: `text` (human-readable)
  - Production: `json` (machine-parseable for log aggregation)

#### `AUDIT_LOG_ENABLED`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable audit logging for security events
- **Requirement:** Implements Requirement 21 (Audit Logging)

### File Upload Configuration

#### `MAX_IMAGE_SIZE`
- **Required:** No
- **Type:** Integer (bytes)
- **Default:** `5242880` (5 MB)
- **Description:** Maximum file size for image uploads
- **Requirement:** Implements Requirement 11.1

#### `MAX_SPREADSHEET_SIZE`
- **Required:** No
- **Type:** Integer (bytes)
- **Default:** `10485760` (10 MB)
- **Description:** Maximum file size for spreadsheet uploads
- **Requirement:** Implements Requirement 11.3

#### `ALLOWED_IMAGE_TYPES`
- **Required:** No
- **Type:** Comma-separated MIME types
- **Default:** `image/jpeg,image/png,image/webp`
- **Description:** Allowed image MIME types
- **Requirement:** Implements Requirement 11.2

#### `ALLOWED_SPREADSHEET_TYPES`
- **Required:** No
- **Type:** Comma-separated MIME types
- **Default:** `text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Description:** Allowed spreadsheet MIME types
- **Requirement:** Implements Requirement 11.4

### Security Configuration

#### `SECURE_COOKIES`
- **Required:** No
- **Type:** Boolean
- **Default:** `false` (development), `true` (production)
- **Description:** Enable HTTPS-only cookies
- **Requirement:** Implements Requirement 12.2
- **Warning:** Must be `true` in production with HTTPS

#### `ENABLE_HSTS`
- **Required:** No
- **Type:** Boolean
- **Default:** `false` (development), `true` (production)
- **Description:** Enable HTTP Strict Transport Security header
- **Requirement:** Implements Requirement 19.4

#### `HSTS_MAX_AGE`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `31536000` (1 year)
- **Description:** HSTS header max-age value

#### `CSP_ENABLED`
- **Required:** No
- **Type:** Boolean
- **Default:** `false` (development), `true` (production)
- **Description:** Enable Content Security Policy header
- **Requirement:** Implements Requirement 19.5

### Performance Configuration

#### `DB_POOL_SIZE`
- **Required:** No
- **Type:** Integer
- **Default:** `10`
- **Description:** Database connection pool size
- **Recommendation:**
  - Development: `5`
  - Production: `20`

#### `DB_POOL_TIMEOUT`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `30`
- **Description:** Database connection pool timeout

#### `API_TIMEOUT`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `30`
- **Description:** API request timeout

#### `CACHE_ENABLED`
- **Required:** No
- **Type:** Boolean
- **Default:** `false` (development), `true` (production)
- **Description:** Enable response caching

#### `CACHE_TTL`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `300` (5 minutes)
- **Description:** Cache time-to-live

## Frontend Variables

### API Configuration

#### `NEXT_PUBLIC_API_URL`
- **Required:** Yes
- **Type:** URL
- **Description:** Backend API URL (accessible from browser)
- **Examples:**
  - Development: `http://localhost:8000`
  - Staging: `https://api-staging.slacademy.com`
  - Production: `https://api.slacademy.com`
- **Note:** Must be accessible from the client browser

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Required:** Yes
- **Type:** URL
- **Description:** Supabase project URL
- **Security:** Safe to expose (public)
- **Note:** Must match backend `SUPABASE_URL`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Required:** Yes
- **Type:** JWT Token
- **Description:** Supabase anonymous key
- **Security:** Safe to expose (RLS protects data)
- **Note:** Must match backend `SUPABASE_ANON_KEY`

### Session Configuration

#### `SESSION_SECRET_KEY`
- **Required:** Yes
- **Type:** String (32+ characters)
- **Description:** Secret key for session encryption
- **Security:** **CRITICAL - MUST MATCH BACKEND KEY**
- **Warning:** Never expose to client (server-side only)

#### `SESSION_MAX_AGE`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `86400` (24 hours)
- **Description:** Session expiration time
- **Note:** Must match backend `SESSION_MAX_AGE`

### Environment Configuration

#### `NODE_ENV`
- **Required:** Yes
- **Type:** String
- **Options:** `development`, `production`
- **Description:** Node.js environment
- **Note:** Automatically set by Next.js in most cases

### PWA Configuration

#### `NEXT_PUBLIC_PWA_ENABLED`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable Progressive Web App features
- **Requirement:** Implements Requirement 16 (PWA Support)

#### `NEXT_PUBLIC_SW_CACHE_NAME`
- **Required:** No
- **Type:** String
- **Default:** `sl-academy-v1`
- **Description:** Service worker cache name
- **Note:** Change version to force cache refresh

### Analytics Configuration

#### `NEXT_PUBLIC_GA_ID`
- **Required:** No
- **Type:** String
- **Description:** Google Analytics tracking ID
- **Format:** `G-XXXXXXXXXX`
- **Note:** Optional, for usage analytics

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Required:** No
- **Type:** URL
- **Description:** Sentry DSN for error tracking
- **Format:** `https://xxx@xxx.ingest.sentry.io/xxx`
- **Note:** Optional, for error monitoring

### Feature Flags

#### `NEXT_PUBLIC_ENABLE_AI_FEATURES`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable AI-powered features (recommendations, summaries)

#### `NEXT_PUBLIC_ENABLE_VIDEO_QUALITY`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable video quality selection

#### `NEXT_PUBLIC_ENABLE_OFFLINE`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable offline mode and caching

### Performance Configuration

#### `NEXT_PUBLIC_API_TIMEOUT`
- **Required:** No
- **Type:** Integer (milliseconds)
- **Default:** `30000` (30 seconds)
- **Description:** API request timeout

#### `NEXT_PUBLIC_ENABLE_CACHE`
- **Required:** No
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable client-side caching

#### `NEXT_PUBLIC_CACHE_REVALIDATE`
- **Required:** No
- **Type:** Integer (seconds)
- **Default:** `60`
- **Description:** Cache revalidation interval

### UI Configuration

#### `NEXT_PUBLIC_ITEMS_PER_PAGE`
- **Required:** No
- **Type:** Integer
- **Default:** `20`
- **Description:** Items per page for pagination
- **Requirement:** Implements Requirement 18.6

#### `NEXT_PUBLIC_DEFAULT_VIDEO_QUALITY`
- **Required:** No
- **Type:** String
- **Default:** `480p`
- **Options:** `360p`, `480p`, `720p`
- **Description:** Default video quality

#### `NEXT_PUBLIC_TOAST_DURATION`
- **Required:** No
- **Type:** Integer (milliseconds)
- **Default:** `5000` (5 seconds)
- **Description:** Toast notification duration

## Environment-Specific Configuration

### Development Environment

**Purpose:** Local development with hot-reload and debugging

**Key Settings:**
- `DEBUG=true` - Detailed error messages
- `API_RELOAD=true` - Auto-reload on code changes
- `SECURE_COOKIES=false` - Allow HTTP (no HTTPS required)
- `LOG_LEVEL=DEBUG` - Verbose logging
- `RATE_LIMIT_*` - Relaxed limits for testing
- `CACHE_ENABLED=false` - Disable caching for fresh data

**Setup:**
```bash
# Backend
cp backend/.env.development backend/.env

# Frontend
cp frontend/.env.development frontend/.env.local
```

### Staging Environment

**Purpose:** Pre-production testing with production-like settings

**Key Settings:**
- `DEBUG=false` - Production error handling
- `API_RELOAD=false` - No auto-reload
- `SECURE_COOKIES=true` - HTTPS required
- `LOG_LEVEL=INFO` - Standard logging
- `LOG_FORMAT=json` - Structured logs
- `RATE_LIMIT_*` - Production limits
- `CACHE_ENABLED=true` - Enable caching

**Setup:**
```bash
# Backend
cp backend/.env.staging backend/.env

# Frontend
cp frontend/.env.staging frontend/.env.local
```

**Important:** Use separate Supabase project and database for staging

### Production Environment

**Purpose:** Live production system with maximum security

**Key Settings:**
- `DEBUG=false` - **CRITICAL**
- `API_RELOAD=false` - **CRITICAL**
- `SECURE_COOKIES=true` - **CRITICAL**
- `ENABLE_HSTS=true` - **CRITICAL**
- `CSP_ENABLED=true` - **CRITICAL**
- `LOG_LEVEL=WARNING` - Minimal logging
- `LOG_FORMAT=json` - Structured logs
- `RATE_LIMIT_*` - Strict limits
- `CACHE_ENABLED=true` - Enable caching
- `DB_POOL_SIZE=20` - Higher concurrency

**Setup:**
```bash
# DO NOT use .env files in production
# Use secrets manager or environment variables
```

**Security Requirements:**
1. Never commit production `.env` files
2. Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
3. Rotate secrets regularly
4. Use unique keys per environment
5. Enable all security headers
6. Monitor for security events

## Security Best Practices

### 1. Secret Management

**DO:**
- ✅ Use secrets manager in production
- ✅ Generate unique keys per environment
- ✅ Rotate secrets regularly (quarterly minimum)
- ✅ Use strong, random keys (32+ characters)
- ✅ Restrict access to production secrets

**DON'T:**
- ❌ Commit `.env` files with real credentials
- ❌ Reuse keys across environments
- ❌ Share secrets via email/chat
- ❌ Use weak or predictable keys
- ❌ Expose service role keys to clients

### 2. Key Generation

**Session Secret Key:**
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# OpenSSL
openssl rand -base64 32
```

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Unique per environment
- Never hardcoded in source

### 3. Environment Isolation

**Critical Rules:**
1. **Separate Supabase projects** for dev/staging/production
2. **Separate databases** for each environment
3. **Separate API keys** for external services
4. **Different session keys** for each environment
5. **Isolated storage buckets** for file uploads

### 4. Access Control

**Production Access:**
- Limit to authorized personnel only
- Use role-based access control
- Enable audit logging
- Require MFA for sensitive operations
- Review access logs regularly

### 5. Monitoring

**What to Monitor:**
- Failed authentication attempts
- Rate limit violations
- API error rates
- Database connection issues
- Unusual access patterns
- Secret access/rotation events

## Setup Instructions

### Initial Setup (Development)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd sl-academy-platform
   ```

2. **Backend setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your Supabase credentials
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm install
   npm run dev
   ```

4. **Verify configuration:**
   - Backend: http://localhost:8000/docs
   - Frontend: http://localhost:3000

### Staging Deployment

1. **Create staging Supabase project**
2. **Copy staging configuration:**
   ```bash
   cp backend/.env.staging backend/.env
   cp frontend/.env.staging frontend/.env.local
   ```
3. **Update with staging credentials**
4. **Deploy to staging environment**
5. **Run smoke tests**

### Production Deployment

1. **Use secrets manager** (not .env files)
2. **Set environment variables** via deployment platform
3. **Verify all security settings** are enabled
4. **Run security audit**
5. **Deploy with zero-downtime strategy**
6. **Monitor for errors**

### Environment Variable Checklist

Before deploying to any environment, verify:

- [ ] All required variables are set
- [ ] Secrets are unique and strong
- [ ] URLs match the environment
- [ ] Security settings are appropriate
- [ ] Rate limits are configured
- [ ] Logging is properly configured
- [ ] CORS origins are correct
- [ ] Session keys match between frontend/backend
- [ ] No secrets are committed to git
- [ ] Backup/recovery procedures are documented

## Troubleshooting

### Common Issues

**Issue:** "Invalid session" errors
- **Cause:** Session keys don't match between frontend/backend
- **Fix:** Ensure `SESSION_SECRET_KEY` is identical in both

**Issue:** CORS errors
- **Cause:** Frontend URL not in `CORS_ORIGINS`
- **Fix:** Add frontend URL to backend `CORS_ORIGINS`

**Issue:** "Supabase connection failed"
- **Cause:** Invalid credentials or URL
- **Fix:** Verify `SUPABASE_URL` and keys in Supabase dashboard

**Issue:** Rate limit errors in development
- **Cause:** Rate limits too strict for testing
- **Fix:** Increase limits in `.env.development` or disable with `RATE_LIMIT_ENABLED=false`

**Issue:** AI features not working
- **Cause:** Invalid or missing OpenAI API key
- **Fix:** Verify `OPENAI_API_KEY` is valid and has credits

### Debug Mode

Enable debug mode to see detailed error messages:

```bash
# Backend
DEBUG=true
LOG_LEVEL=DEBUG

# Frontend
NODE_ENV=development
```

**Warning:** Never enable debug mode in production!

## Support

For questions or issues:
1. Check this documentation
2. Review `.env.example` files
3. Check application logs
4. Contact the development team

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [FastAPI Configuration](https://fastapi.tiangolo.com/advanced/settings/)
- [12-Factor App Methodology](https://12factor.net/config)
