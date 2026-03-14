# Environment Setup Quick Start

This guide provides quick setup instructions for different environments.

## 🚀 Quick Setup

### Development (Local)

```bash
# Backend
cd backend
cp .env.development .env
# Edit .env with your Supabase credentials
python main.py

# Frontend (new terminal)
cd frontend
cp .env.development .env.local
# Edit .env.local with your configuration
npm run dev
```

**Required Changes:**
1. Update `SUPABASE_URL` with your project URL
2. Update `SUPABASE_ANON_KEY` with your anon key
3. Update `SUPABASE_SERVICE_KEY` with your service key
4. Update `OPENAI_API_KEY` if using AI features

### Staging

```bash
# Backend
cd backend
cp .env.staging .env
# Update with staging credentials
# Deploy to staging server

# Frontend
cd frontend
cp .env.staging .env.local
# Update with staging configuration
# Deploy to staging server
```

### Production

**⚠️ NEVER use .env files in production!**

Use your deployment platform's secrets manager:
- AWS: AWS Secrets Manager
- Vercel: Environment Variables UI
- Heroku: Config Vars
- Docker: Docker Secrets

## 🔑 Generate Secret Keys

```bash
# Python (for backend)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Node.js (for frontend)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📋 Environment Checklist

### Backend (.env)
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service key (KEEP SECRET!)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET_KEY` - 32+ character random key
- [ ] `OPENAI_API_KEY` - OpenAI API key (optional)
- [ ] `CORS_ORIGINS` - Frontend URLs

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Same as backend
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as backend
- [ ] `SESSION_SECRET_KEY` - MUST MATCH backend key

## 🔍 Verify Setup

### Backend
```bash
cd backend
python main.py
# Visit: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm run dev
# Visit: http://localhost:3000
```

## 🐛 Common Issues

### "Invalid session" errors
- **Fix:** Ensure `SESSION_SECRET_KEY` matches in both backend and frontend

### CORS errors
- **Fix:** Add frontend URL to backend `CORS_ORIGINS`

### Supabase connection failed
- **Fix:** Verify credentials in Supabase Dashboard → Project Settings → API

### Rate limit errors (development)
- **Fix:** Increase limits in `.env` or set `RATE_LIMIT_ENABLED=false`

## 📚 Full Documentation

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete documentation.

## 🔒 Security Reminders

1. ✅ Never commit `.env` files with real credentials
2. ✅ Use unique keys per environment
3. ✅ Rotate secrets regularly
4. ✅ Keep `SUPABASE_SERVICE_KEY` secret
5. ✅ Use secrets manager in production
