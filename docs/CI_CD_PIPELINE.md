# CI/CD Pipeline Documentation

## Overview

The SL Academy Platform uses GitHub Actions for continuous integration and continuous deployment. The pipeline automates testing, security scanning, and deployment to staging and production environments.

## Pipeline Architecture

```
┌─────────────────┐
│  Pull Request   │
│   or Push       │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐
│  Backend Tests  │                  │ Frontend Tests  │
│  - Linting      │                  │  - Linting      │
│  - Unit Tests   │                  │  - Type Check   │
│  - Coverage     │                  │  - Unit Tests   │
└────────┬────────┘                  │  - Build        │
         │                           └────────┬────────┘
         │                                    │
         └──────────────┬─────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Security Scan  │
              │  - Dependencies │
              │  - Secrets      │
              │  - Code Quality │
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Deploy Staging  │         │Deploy Production│
│  - Backend      │         │  - Backup DB    │
│  - Frontend     │         │  - Backend      │
│  - Migrations   │         │  - Frontend     │
└────────┬────────┘         │  - Migrations   │
         │                  │  - Verify       │
         ▼                  └─────────────────┘
┌─────────────────┐
│   E2E Tests     │
│  - Auth Flow    │
│  - User Journey │
│  - Multi-tenant │
└─────────────────┘
```

## Workflows

### 1. Main CI/CD Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `develop`, or `staging` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Backend Tests
- Sets up Python 3.11
- Installs dependencies from `requirements.txt`
- Runs flake8 linting
- Executes pytest with coverage
- Uploads coverage to Codecov

**Required Secrets:**
- `SUPABASE_URL_TEST`
- `SUPABASE_ANON_KEY_TEST`
- `SUPABASE_SERVICE_KEY_TEST`
- `SESSION_SECRET_KEY_TEST`
- `OPENAI_API_KEY_TEST`

#### Frontend Tests
- Sets up Node.js 18
- Installs dependencies with `npm ci`
- Runs ESLint
- Runs TypeScript type checking
- Executes Jest unit tests
- Builds Next.js application

**Required Secrets:**
- `NEXT_PUBLIC_API_URL_TEST`
- `NEXT_PUBLIC_SUPABASE_URL_TEST`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST`

#### E2E Tests
- Runs only on `staging` or `main` branches
- Requires backend and frontend tests to pass
- Installs Playwright browsers
- Executes E2E tests against staging environment
- Uploads test reports as artifacts

**Required Secrets:**
- `STAGING_URL`

#### Deploy to Staging
- Runs only on `staging` branch
- Requires backend and frontend tests to pass
- Deploys backend and frontend
- Runs database migrations

**Required Secrets:**
- `STAGING_URL`
- `DATABASE_URL_STAGING`

#### Deploy to Production
- Runs only on `main` branch
- Requires all tests (including E2E) to pass
- Creates database backup
- Deploys backend and frontend
- Runs database migrations
- Verifies deployment
- Notifies team

**Required Secrets:**
- `PRODUCTION_URL`
- `DATABASE_URL_PRODUCTION`

### 2. Security Scan Workflow (`.github/workflows/security-scan.yml`)

**Triggers:**
- Daily at 2 AM UTC (scheduled)
- Push to `main` or `develop`
- Pull requests to `main`

**Jobs:**

#### Dependency Vulnerability Scan
- Scans Python dependencies with Snyk
- Scans Node.js dependencies with Snyk
- Runs `npm audit` for frontend

**Required Secrets:**
- `SNYK_TOKEN`

#### Secret Scanning
- Uses Gitleaks to detect secrets in code
- Scans entire git history

#### Code Quality Analysis
- Runs SonarCloud analysis
- Checks code quality metrics
- Identifies code smells and bugs

**Required Secrets:**
- `SONAR_TOKEN`

## Branch Strategy

### Main Branches

1. **`main`** - Production branch
   - Protected branch
   - Requires PR approval
   - Triggers production deployment
   - All tests must pass

2. **`staging`** - Staging branch
   - Pre-production testing
   - Triggers staging deployment
   - E2E tests run here

3. **`develop`** - Development branch
   - Active development
   - Feature branches merge here
   - CI tests run on every push

### Feature Branches

- Branch from `develop`
- Naming: `feature/description` or `fix/description`
- Create PR to `develop` when ready
- Squash and merge after approval

## Required GitHub Secrets

### Test Environment
```
SUPABASE_URL_TEST=https://test-project.supabase.co
SUPABASE_ANON_KEY_TEST=eyJ...
SUPABASE_SERVICE_KEY_TEST=eyJ...
SESSION_SECRET_KEY_TEST=your-32-char-secret-key-here
OPENAI_API_KEY_TEST=sk-test-key
NEXT_PUBLIC_API_URL_TEST=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL_TEST=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST=eyJ...
```

### Staging Environment
```
STAGING_URL=https://staging.slacademy.com
DATABASE_URL_STAGING=postgresql://...
```

### Production Environment
```
PRODUCTION_URL=https://slacademy.com
DATABASE_URL_PRODUCTION=postgresql://...
```

### Third-Party Services
```
SNYK_TOKEN=your-snyk-token
SONAR_TOKEN=your-sonarcloud-token
CODECOV_TOKEN=your-codecov-token
```

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value
5. Secrets are encrypted and not visible after creation

## Local Testing

### Backend Tests
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio flake8

# Run linting
flake8 .

# Run tests with coverage
pytest tests/ --cov=. --cov-report=term
```

### Frontend Tests
```bash
cd frontend
npm install

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run unit tests
npm run test

# Run E2E tests (requires dev server running)
npm run test:e2e
```

## Deployment Procedures

### Deploying to Staging

1. Merge feature branch to `staging`
2. GitHub Actions automatically:
   - Runs all tests
   - Deploys to staging environment
   - Runs E2E tests
3. Verify deployment at staging URL
4. Test critical user flows manually

### Deploying to Production

1. Create PR from `staging` to `main`
2. Get approval from team lead
3. Merge PR to `main`
4. GitHub Actions automatically:
   - Creates database backup
   - Runs all tests including E2E
   - Deploys to production
   - Runs migrations
   - Verifies deployment
   - Notifies team
5. Monitor error tracking and logs
6. Verify critical functionality

### Manual Deployment (Emergency)

If automated deployment fails:

```bash
# Backend deployment (example for Railway)
cd backend
railway up

# Frontend deployment (example for Vercel)
cd frontend
vercel --prod

# Run migrations manually
psql "$DATABASE_URL_PRODUCTION" -f supabase/migrations/XXX_migration.sql
```

## Rollback Procedures

### Automated Rollback

If deployment verification fails, the pipeline will:
1. Alert the team
2. Restore from backup (manual step)
3. Redeploy previous version

### Manual Rollback

```bash
# 1. Restore database from backup
psql "$DATABASE_URL_PRODUCTION" < backup_YYYYMMDD_HHMMSS.sql

# 2. Revert to previous deployment
# For Railway:
railway rollback

# For Vercel:
vercel rollback

# 3. Verify rollback
curl https://slacademy.com/api/health
```

## Monitoring and Alerts

### What We Monitor

1. **Build Status**
   - GitHub Actions workflow status
   - Email notifications on failure

2. **Test Coverage**
   - Codecov reports
   - Coverage threshold: 70%

3. **Security Vulnerabilities**
   - Snyk alerts
   - Gitleaks secret detection
   - SonarCloud quality gates

4. **Deployment Status**
   - Deployment success/failure
   - Health check endpoints

### Alert Channels

- **GitHub Actions**: Email notifications
- **Slack**: Deployment notifications (configure webhook)
- **Sentry**: Runtime error tracking (configure in production)

## Performance Benchmarks

### CI Pipeline Performance Targets

- Backend tests: < 5 minutes
- Frontend tests: < 10 minutes
- E2E tests: < 15 minutes
- Total pipeline: < 30 minutes

### Optimization Tips

1. **Cache Dependencies**
   - Python packages cached by setup-python
   - Node modules cached by setup-node

2. **Parallel Execution**
   - Backend and frontend tests run in parallel
   - E2E tests run after both complete

3. **Selective Testing**
   - E2E tests only on staging/production deployments
   - Security scans run daily, not on every PR

## Troubleshooting

### Tests Failing on CI but Passing Locally

**Cause:** Environment differences

**Solution:**
```bash
# Use same environment variables as CI
export SUPABASE_URL=$SUPABASE_URL_TEST
export SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY_TEST
# ... other variables

# Run tests
pytest tests/
npm run test:ci
```

### Deployment Fails with "Migration Error"

**Cause:** Migration already applied or conflicts

**Solution:**
1. Check migration status in Supabase dashboard
2. Manually apply or skip migration
3. Redeploy

### E2E Tests Timeout

**Cause:** Staging environment slow or unavailable

**Solution:**
1. Check staging environment health
2. Increase timeout in `playwright.config.ts`
3. Retry failed tests

### Secret Not Found Error

**Cause:** Missing or incorrectly named secret

**Solution:**
1. Verify secret name matches workflow file
2. Check secret is set in repository settings
3. Ensure secret has correct value

## Best Practices

### For Developers

1. **Run tests locally before pushing**
   ```bash
   npm run lint && npm run type-check && npm run test
   ```

2. **Keep PRs small and focused**
   - Easier to review
   - Faster CI execution
   - Easier to rollback

3. **Write tests for new features**
   - Unit tests for logic
   - E2E tests for critical flows

4. **Don't commit secrets**
   - Use `.env.example` for templates
   - Never commit `.env` files

### For Reviewers

1. **Check CI status before approving**
2. **Verify test coverage hasn't decreased**
3. **Review security scan results**
4. **Test locally if changes are complex**

### For Deployers

1. **Deploy during low-traffic hours**
2. **Monitor logs after deployment**
3. **Have rollback plan ready**
4. **Communicate with team**

## Continuous Improvement

### Metrics to Track

- Build success rate
- Average build time
- Test coverage trend
- Deployment frequency
- Mean time to recovery (MTTR)

### Regular Reviews

- Monthly: Review CI/CD metrics
- Quarterly: Update dependencies
- Annually: Review and update workflows

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Snyk Documentation](https://docs.snyk.io/)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)

## Support

For CI/CD issues:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check error messages and stack traces
4. Contact DevOps team
5. Create issue in repository

