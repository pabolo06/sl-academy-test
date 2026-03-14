# Secrets Management - Quick Start Guide

## For Developers (Local Development)

### 1. Set Up Environment Variables

```bash
cd backend

# Copy example file
cp .env.example .env

# Edit .env with your credentials
# Use your editor of choice
nano .env
```

### 2. Generate Strong Secrets

```bash
# Generate session secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env
SESSION_SECRET_KEY=<generated-secret>
```

### 3. Verify Setup

```bash
# Test secrets loading
python3 -c "from core.secrets import get_secrets, validate_secrets; print('Valid:', validate_secrets())"
```

## For DevOps (Production Setup)

### 1. Install AWS CLI

```bash
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get install awscli

# Configure
aws configure
```

### 2. Create Secrets in AWS

```bash
# Set environment
export ENVIRONMENT=production

# Create backend secrets
aws secretsmanager create-secret \
    --name sl-academy/production/backend \
    --description "SL Academy backend secrets" \
    --secret-string file://secrets.json

# secrets.json format:
# {
#   "SUPABASE_URL": "https://xxx.supabase.co",
#   "SUPABASE_ANON_KEY": "xxx",
#   "SUPABASE_SERVICE_KEY": "xxx",
#   "SESSION_SECRET_KEY": "xxx",
#   "OPENAI_API_KEY": "sk-xxx"
# }
```

### 3. Configure Application

```bash
# Set environment variables for production
export USE_SECRETS_MANAGER=true
export ENVIRONMENT=production
export AWS_REGION=us-east-1

# Restart application
# Application will now load secrets from AWS
```

### 4. Set Up Automated Rotation

```bash
# Make script executable
chmod +x backend/scripts/rotate_secrets.py

# Test dry run
DRY_RUN=true python3 backend/scripts/rotate_secrets.py

# Schedule rotation (every 90 days)
# Add to crontab:
0 2 1 */3 * cd /path/to/backend && python3 scripts/rotate_secrets.py >> logs/rotation.log 2>&1
```

## For CI/CD (GitHub Actions)

### 1. Add Secrets to GitHub

1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `SUPABASE_SERVICE_KEY`
   - `SESSION_SECRET_KEY`
   - `OPENAI_API_KEY`
   - `AWS_ACCESS_KEY_ID` (for deployment)
   - `AWS_SECRET_ACCESS_KEY` (for deployment)

### 2. Use in Workflows

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SESSION_SECRET_KEY: ${{ secrets.SESSION_SECRET_KEY }}
        run: |
          # Deployment commands
```

## Common Tasks

### Rotate Session Secret

```bash
# Production
python3 backend/scripts/rotate_secrets.py

# Follow prompts
# Restart application after rotation
```

### Check Rotation Status

```bash
# Check last rotation date
aws secretsmanager describe-secret \
    --secret-id sl-academy/production/backend \
    --query 'Tags[?Key==`LastRotated`].Value' \
    --output text
```

### Emergency Rotation

```bash
# If secret is compromised
python3 backend/scripts/rotate_secrets.py

# Answer 'yes' to proceed immediately
# Restart application
# Monitor logs for errors
```

### Migrate from .env to AWS

```bash
# 1. Create secrets from .env
python3 << EOF
import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv('backend/.env')

secrets = {
    'SUPABASE_URL': os.getenv('SUPABASE_URL'),
    'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY'),
    'SUPABASE_SERVICE_KEY': os.getenv('SUPABASE_SERVICE_KEY'),
    'SESSION_SECRET_KEY': os.getenv('SESSION_SECRET_KEY'),
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
}

client = boto3.client('secretsmanager', region_name='us-east-1')
client.create_secret(
    Name='sl-academy/production/backend',
    SecretString=json.dumps(secrets)
)
print("✅ Secrets migrated to AWS")
EOF

# 2. Enable secrets manager
export USE_SECRETS_MANAGER=true

# 3. Test
python3 -c "from core.secrets import get_secrets; print('✅ Secrets loaded from AWS')"

# 4. Remove .env (after verification)
rm backend/.env
```

## Troubleshooting

### "Missing required secrets" error

```bash
# Check environment variables
env | grep -E "(SUPABASE|SESSION|OPENAI)"

# Or check AWS secrets
aws secretsmanager get-secret-value \
    --secret-id sl-academy/production/backend \
    --query SecretString \
    --output text | jq
```

### "boto3 not installed" error

```bash
# Install boto3
pip install boto3

# Or add to requirements.txt
echo "boto3>=1.28.0" >> backend/requirements.txt
pip install -r backend/requirements.txt
```

### "Access denied" error

```bash
# Check IAM permissions
aws sts get-caller-identity

# Verify IAM policy allows:
# - secretsmanager:GetSecretValue
# - secretsmanager:DescribeSecret
```

### Application won't start after rotation

```bash
# 1. Check secrets are valid
aws secretsmanager get-secret-value \
    --secret-id sl-academy/production/backend

# 2. Verify application can access secrets
python3 -c "from core.secrets import validate_secrets; print(validate_secrets())"

# 3. Check application logs
tail -f backend/logs/app.log

# 4. If needed, rollback to previous version
aws secretsmanager get-secret-value \
    --secret-id sl-academy/production/backend \
    --version-stage AWSPREVIOUS
```

## Security Checklist

- [ ] Never commit .env files to git
- [ ] Use different secrets for dev/staging/production
- [ ] Rotate critical secrets every 90 days
- [ ] Use AWS Secrets Manager for production
- [ ] Enable CloudTrail for audit logging
- [ ] Set up alerts for secret access
- [ ] Document all secrets and their purpose
- [ ] Test rotation procedures regularly
- [ ] Have incident response plan ready
- [ ] Monitor for secret exposure in logs

## Quick Reference

| Task | Command |
|------|---------|
| Generate secret | `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| Validate secrets | `python3 -c "from core.secrets import validate_secrets; print(validate_secrets())"` |
| Rotate secrets | `python3 backend/scripts/rotate_secrets.py` |
| Check rotation date | `aws secretsmanager describe-secret --secret-id sl-academy/production/backend` |
| View secrets (dev) | `cat backend/.env` |
| View secrets (prod) | `aws secretsmanager get-secret-value --secret-id sl-academy/production/backend` |

## Support

For help with secrets management:
1. Check [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for detailed guide
2. Review AWS Secrets Manager console
3. Check CloudTrail logs for access issues
4. Contact DevOps team
5. Escalate to security team if needed
