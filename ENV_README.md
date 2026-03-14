# Environment Configuration

This document provides an overview of environment configuration for the SL Academy Platform.

## 📁 Configuration Files

### Backend (`backend/`)
- `.env.example` - Template with full documentation (COMMIT THIS)
- `.env.development` - Development defaults (COMMIT THIS)
- `.env.staging` - Staging configuration template (COMMIT THIS)
- `.env.production` - Production configuration template (COMMIT THIS)
- `.env` - Active configuration (NEVER COMMIT)

### Frontend (`frontend/`)
- `.env.example` - Template with full documentation (COMMIT THIS)
- `.env.development` - Development defaults (COMMIT THIS)
- `.env.staging` - Staging configuration template (COMMIT THIS)
- `.env.production` - Production configuration template (COMMIT THIS)
- `.env.local` - Active configuration (NEVER COMMIT)

## 🚀 Quick Start

### First Time Setup

1. **Backend:**
   ```bash
   cd backend
   cp .env.development .env
   # Edit .env with your Supabase credentials
   ```

2. **Frontend:**
   ```bash
   cd frontend
   cp .env.development .env.local
   # Edit .env.local with your configuration
   ```

3. **Get Supabase Credentials:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Project Settings → API
   - Copy:
     - Project URL → `SUPABASE_URL`
     - anon/public key → `SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_KEY`

4. **Generate Session Secret:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Use the same key in both backend and frontend `SESSION_SECRET_KEY`

5. **Start the application:**
   ```bash
   # Backend
   cd backend && python main.py
   
   # Frontend (new terminal)
   cd frontend && npm run dev
   ```

## 📚 Documentation

- **[ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)** - Complete documentation of all variables
- **[ENVIRONMENT_SETUP_QUICKSTART.md](docs/ENVIRONMENT_SETUP_QUICKSTART.md)** - Quick setup guide

## 🔒 Security

### Critical Rules

1. **NEVER commit `.env` or `.env.local` files** with real credentials
2. **Use unique session keys** for each environment
3. **Keep `SUPABASE_SERVICE_KEY` secret** - it bypasses all security
4. **Rotate secrets regularly** (quarterly minimum)
5. **Use secrets manager in production** (not .env files)

### What's Safe to Commit

✅ `.env.example` files (templates without real values)
✅ `.env.development` files (with placeholder values)
✅ `.env.staging` files (with placeholder values)
✅ `.env.production` files (with placeholder values)

❌ `.env` files (active configuration)
❌ `.env.local` files (active configuration)
❌ Any file with real credentials

## 🌍 Environments

### Development
- **Purpose:** Local development
- **Security:** Relaxed (HTTP allowed, debug enabled)
- **Rate Limits:** Relaxed for testing
- **Logging:** Verbose (DEBUG level)

### Staging
- **Purpose:** Pre-production testing
- **Security:** Production-like (HTTPS required)
- **Rate Limits:** Production limits
- **Logging:** Standard (INFO level)
- **Note:** Use separate Supabase project

### Production
- **Purpose:** Live system
- **Security:** Maximum (all security headers enabled)
- **Rate Limits:** Strict
- **Logging:** Minimal (WARNING level)
- **Note:** Use secrets manager, not .env files

## 🔑 Required Variables

### Backend Minimum
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://...
SESSION_SECRET_KEY=your-32-char-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend Minimum
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SESSION_SECRET_KEY=your-32-char-key
```

## 🐛 Troubleshooting

### "Invalid session" errors
**Problem:** Session keys don't match
**Solution:** Ensure `SESSION_SECRET_KEY` is identical in backend/.env and frontend/.env.local

### CORS errors
**Problem:** Frontend URL not allowed
**Solution:** Add frontend URL to backend `CORS_ORIGINS`

### Supabase connection failed
**Problem:** Invalid credentials
**Solution:** Verify credentials in Supabase Dashboard → Project Settings → API

### AI features not working
**Problem:** Missing or invalid OpenAI key
**Solution:** Add valid `OPENAI_API_KEY` to backend/.env

## 📞 Support

For detailed documentation, see:
- [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
- [docs/ENVIRONMENT_SETUP_QUICKSTART.md](docs/ENVIRONMENT_SETUP_QUICKSTART.md)

For issues, contact the development team.
