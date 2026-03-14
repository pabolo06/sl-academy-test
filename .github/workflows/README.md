# GitHub Actions Workflows

This directory contains automated workflows for the SL Academy Platform.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

Main continuous integration and deployment workflow.

**Triggers:**
- Push to `main`, `develop`, `staging`
- Pull requests to `main`, `develop`

**Jobs:**
- `backend-test`: Python linting and unit tests
- `frontend-test`: TypeScript linting, type checking, unit tests, and build
- `e2e-test`: End-to-end tests with Playwright (staging/production only)
- `deploy-staging`: Deploy to staging environment
- `deploy-production`: Deploy to production environment

**Status Badge:**
```markdown
![CI/CD](https://github.com/your-org/sl-academy-platform/workflows/CI%2FCD%20Pipeline/badge.svg)
```

### 2. Security Scan (`security-scan.yml`)

Automated security scanning for vulnerabilities and code quality.

**Triggers:**
- Daily at 2 AM UTC (scheduled)
- Push to `main`, `develop`
- Pull requests to `main`

**Jobs:**
- `dependency-scan`: Snyk and npm audit for dependency vulnerabilities
- `secret-scan`: Gitleaks for secret detection
- `code-quality`: SonarCloud for code quality analysis

**Status Badge:**
```markdown
![Security Scan](https://github.com/your-org/sl-academy-platform/workflows/Security%20Scan/badge.svg)
```

## Required Secrets

Configure these in **Settings** → **Secrets and variables** → **Actions**:

### Test Environment
- `SUPABASE_URL_TEST`
- `SUPABASE_ANON_KEY_TEST`
- `SUPABASE_SERVICE_KEY_TEST`
- `SESSION_SECRET_KEY_TEST`
- `OPENAI_API_KEY_TEST`
- `NEXT_PUBLIC_API_URL_TEST`
- `NEXT_PUBLIC_SUPABASE_URL_TEST`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST`

### Staging Environment
- `STAGING_URL`
- `DATABASE_URL_STAGING`

### Production Environment
- `PRODUCTION_URL`
- `DATABASE_URL_PRODUCTION`

### Third-Party Services (Optional)
- `SNYK_TOKEN`
- `SONAR_TOKEN`
- `CODECOV_TOKEN`

## Customization

### Adding New Tests

Edit `ci.yml` and add steps to the appropriate job:

```yaml
- name: Run new test
  working-directory: ./backend
  run: pytest tests/new_test.py
```

### Changing Deployment Target

Update the deployment steps in `ci.yml`:

```yaml
- name: Deploy backend to production
  run: |
    # Your deployment commands here
    railway up
    # or
    vercel --prod
```

### Adding New Workflow

Create a new `.yml` file in this directory:

```yaml
name: My New Workflow

on:
  push:
    branches: [main]

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Do something
        run: echo "Hello World"
```

## Monitoring

### View Workflow Runs

**GitHub UI:**
1. Go to **Actions** tab
2. Select workflow from left sidebar
3. View run history and logs

**GitHub CLI:**
```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Watch current run
gh run watch

# Rerun failed jobs
gh run rerun <run-id>
```

### Notifications

Configure notifications in **Settings** → **Notifications**:
- Email on workflow failure
- Slack webhook (add to workflow)
- Discord webhook (add to workflow)

## Troubleshooting

### Workflow Not Triggering

**Check:**
1. Branch name matches trigger configuration
2. Workflow file is in `.github/workflows/`
3. YAML syntax is valid (use yamllint)

### Job Failing

**Debug:**
1. Check job logs in Actions tab
2. Look for error messages
3. Verify secrets are configured
4. Test locally with same environment

### Slow Workflow

**Optimize:**
1. Enable dependency caching
2. Run jobs in parallel
3. Reduce test scope for PRs
4. Use matrix strategy for multiple versions

## Best Practices

1. **Keep workflows fast** (< 30 minutes total)
2. **Use caching** for dependencies
3. **Run expensive tests** only on main branches
4. **Fail fast** - stop on first error
5. **Use secrets** for sensitive data
6. **Add status badges** to README
7. **Monitor workflow metrics** regularly

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [CI/CD Pipeline Guide](../../docs/CI_CD_PIPELINE.md)
- [CI/CD Quick Start](../../docs/CI_CD_QUICKSTART.md)

## Support

For workflow issues:
1. Check workflow logs
2. Review this documentation
3. Check GitHub Actions status page
4. Contact DevOps team
