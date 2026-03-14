# CI/CD Quick Start Guide

## Setup (One-Time)

### 1. Configure GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** and add:

**Test Environment:**
```
SUPABASE_URL_TEST
SUPABASE_ANON_KEY_TEST
SUPABASE_SERVICE_KEY_TEST
SESSION_SECRET_KEY_TEST
OPENAI_API_KEY_TEST
NEXT_PUBLIC_API_URL_TEST
NEXT_PUBLIC_SUPABASE_URL_TEST
NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST
```

**Staging:**
```
STAGING_URL
DATABASE_URL_STAGING
```

**Production:**
```
PRODUCTION_URL
DATABASE_URL_PRODUCTION
```

**Third-Party:**
```
SNYK_TOKEN (optional)
SONAR_TOKEN (optional)
CODECOV_TOKEN (optional)
```

### 2. Install Test Dependencies

**Backend:**
```bash
cd backend
pip install pytest pytest-cov pytest-asyncio flake8
```

**Frontend:**
```bash
cd frontend
npm install
```

## Daily Workflow

### Creating a Feature

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add my feature"

# 3. Run tests locally
cd backend && pytest tests/
cd ../frontend && npm run test && npm run lint

# 4. Push to GitHub
git push origin feature/my-feature

# 5. Create PR to develop
# GitHub Actions will automatically run tests
```

### Deploying to Staging

```bash
# 1. Merge feature to staging branch
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. GitHub Actions automatically:
#    - Runs all tests
#    - Deploys to staging
#    - Runs E2E tests

# 3. Verify at staging URL
```

### Deploying to Production

```bash
# 1. Create PR from staging to main
# 2. Get approval
# 3. Merge PR

# GitHub Actions automatically:
# - Creates backup
# - Runs all tests
# - Deploys to production
# - Verifies deployment
```

## Common Commands

### Run All Tests Locally

```bash
# Backend
cd backend
flake8 .
pytest tests/ --cov=. --cov-report=term

# Frontend
cd frontend
npm run lint
npm run type-check
npm run test:ci
npm run build
```

### Run E2E Tests

```bash
cd frontend

# Install browsers (first time only)
npx playwright install

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Check CI Status

```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch current run
gh run watch
```

## Troubleshooting

### Tests Pass Locally but Fail on CI

```bash
# Use same environment as CI
export SUPABASE_URL=$SUPABASE_URL_TEST
# ... other env vars

# Run tests
pytest tests/
npm run test:ci
```

### Deployment Failed

```bash
# Check logs
gh run view --log

# Retry deployment
gh run rerun <run-id>

# Manual deployment (emergency)
railway up  # or vercel --prod
```

### Rollback Production

```bash
# 1. Restore database
psql "$DATABASE_URL_PRODUCTION" < backup.sql

# 2. Rollback deployment
railway rollback  # or vercel rollback

# 3. Verify
curl https://slacademy.com/api/health
```

## Quick Reference

| Task | Command |
|------|---------|
| Run backend tests | `cd backend && pytest tests/` |
| Run frontend tests | `cd frontend && npm run test` |
| Run linting | `npm run lint` or `flake8 .` |
| Run type check | `npm run type-check` |
| Run E2E tests | `npm run test:e2e` |
| Build frontend | `npm run build` |
| View CI runs | `gh run list` |
| Watch CI run | `gh run watch` |
| Rerun failed job | `gh run rerun <run-id>` |

## Branch Strategy

```
main (production)
  ↑
staging (pre-production)
  ↑
develop (active development)
  ↑
feature/* (feature branches)
```

## Deployment Flow

```
Feature → Develop → Staging → Production
         (CI)     (CI+Deploy) (CI+E2E+Deploy)
```

## Need Help?

- **CI/CD Issues**: Check [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md)
- **Environment Setup**: Check [ENVIRONMENT_SETUP_QUICKSTART.md](./ENVIRONMENT_SETUP_QUICKSTART.md)
- **Database Migrations**: Check [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)
- **General Setup**: Check [QUICKSTART.md](../QUICKSTART.md)
