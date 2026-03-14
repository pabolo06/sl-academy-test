# Secrets Management Guide

## Overview

This guide covers secure secrets management for the SL Academy Platform, including storage, rotation, and access control for sensitive credentials.

## Secrets Inventory

### Backend Secrets

| Secret | Purpose | Rotation Frequency | Critical |
|--------|---------|-------------------|----------|
| `SUPABASE_SERVICE_KEY` | Database admin access | 90 days | ✅ Yes |
| `SESSION_SECRET_KEY` | Session encryption | 90 days | ✅ Yes |
| `OPENAI_API_KEY` | AI service access | 180 days | ⚠️ Medium |
| `SENTRY_DSN` | Error tracking | Never | ❌ No |
| `SLACK_WEBHOOK_URL` | Alert notifications | 180 days | ❌ No |
| `EMAIL_SMTP_PASSWORD` | Email notifications | 90 days | ⚠️ Medium |

### Frontend Secrets

| Secret | Purpose | Rotation Frequency | Critical |
|--------|---------|-------------------|----------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public database access | 180 days | ⚠️ Medium |
| `SENTRY_DSN` | Error tracking | Never | ❌ No |

### Infrastructure Secrets

| Secret | Purpose | Rotation Frequency | Critical |
|--------|---------|-------------------|----------|
| `DATABASE_URL` | Direct database connection | 90 days | ✅ Yes |
| `AWS_ACCESS_KEY_ID` | Cloud storage access | 90 days | ✅ Yes |
| `AWS_SECRET_ACCESS_KEY` | Cloud storage access | 90 days | ✅ Yes |

## Secrets Storage Solutions

### Option 1: Environment Variables (Development Only)

**Use for**: Local development only

**Setup**:
```bash
# .env (NEVER commit to git)
SUPABASE_SERVICE_KEY=your-secret-key
SESSION_SECRET_KEY=your-session-secret
```

**Pros**:
- Simple setup
- No additional tools required

**Cons**:
- Not secure for production
- No audit trail
- No rotation support
- Risk of accidental exposure

### Option 2: AWS Secrets Manager (Recommended for Production)

**Use for**: Production and staging environments

**Setup**:

1. **Install AWS CLI**:
```bash
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get install awscli

# Windows
# Download from https://aws.amazon.com/cli/
```

2. **Configure AWS credentials**:
```bash
aws configure
# Enter AWS Access Key ID
# Enter AWS Secret Access Key
# Enter region (e.g., us-east-1)
```

3. **Create secrets**:
```bash
# Create backend secrets
aws secretsmanager create-secret \
    --name sl-academy/production/backend \
    --description "SL Academy backend secrets" \
    --secret-string '{
        "SUPABASE_SERVICE_KEY": "your-key",
        "SESSION_SECRET_KEY": "your-secret",
        "OPENAI_API_KEY": "your-api-key"
    }'

# Create frontend secrets
aws secretsmanager create-secret \
    --name sl-academy/production/frontend \
    --description "SL Academy frontend secrets" \
    --secret-string '{
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your-key"
    }'
```

4. **Retrieve secrets in application**:
```python
# backend/core/secrets.py
import boto3
import json
from functools import lru_cache

@lru_cache(maxsize=1)
def get_secrets():
    """Retrieve secrets from AWS Secrets Manager."""
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        response = client.get_secret_value(
            SecretId='sl-academy/production/backend'
        )
        return json.loads(response['SecretString'])
    except Exception as e:
        # Fallback to environment variables for development
        import os
        return {
            'SUPABASE_SERVICE_KEY': os.getenv('SUPABASE_SERVICE_KEY'),
            'SESSION_SECRET_KEY': os.getenv('SESSION_SECRET_KEY'),
            'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
        }

# Usage
secrets = get_secrets()
SUPABASE_SERVICE_KEY = secrets['SUPABASE_SERVICE_KEY']
```

**Pros**:
- Secure storage with encryption at rest
- Automatic rotation support
- Audit trail with CloudTrail
- Fine-grained access control with IAM
- Versioning support

**Cons**:
- Additional cost (~$0.40/secret/month)
- Requires AWS account
- Slightly more complex setup

### Option 3: HashiCorp Vault (Enterprise)

**Use for**: Large-scale deployments with complex requirements

**Setup**: See [HashiCorp Vault documentation](https://www.vaultproject.io/docs)

**Pros**:
- Dynamic secrets
- Advanced access control
- Multi-cloud support
- Comprehensive audit logging

**Cons**:
- Complex setup and maintenance
- Requires dedicated infrastructure
- Higher operational overhead

### Option 4: GitHub Secrets (CI/CD Only)

**Use for**: GitHub Actions workflows

**Setup**:

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secrets:
   - `SUPABASE_SERVICE_KEY`
   - `SESSION_SECRET_KEY`
   - `OPENAI_API_KEY`
   - etc.

4. Use in workflows:
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

**Pros**:
- Integrated with GitHub Actions
- Free for public and private repos
- Easy to use

**Cons**:
- Only available in CI/CD
- No rotation support
- Limited to GitHub ecosystem

## Secrets Rotation

### Rotation Schedule

| Secret Type | Frequency | Automated |
|-------------|-----------|-----------|
| Critical (database, session) | 90 days | ✅ Yes |
| Medium (API keys) | 180 days | ⚠️ Partial |
| Low (webhooks) | 365 days | ❌ Manual |

### Rotation Procedures

#### 1. Supabase Service Key

```bash
# 1. Generate new service key in Supabase Dashboard
# Settings → API → Generate new service_role key

# 2. Update secret in AWS Secrets Manager
aws secretsmanager update-secret \
    --secret-id sl-academy/production/backend \
    --secret-string '{
        "SUPABASE_SERVICE_KEY": "new-key",
        "SESSION_SECRET_KEY": "existing-secret",
        "OPENAI_API_KEY": "existing-key"
    }'

# 3. Restart application to load new secret
# (Application should reload secrets on restart)

# 4. Verify new key works
curl -H "Authorization: Bearer new-key" \
    https://your-project.supabase.co/rest/v1/profiles

# 5. Revoke old key in Supabase Dashboard
```

#### 2. Session Secret Key

```bash
# 1. Generate new 32-character secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Update secret in AWS Secrets Manager
aws secretsmanager update-secret \
    --secret-id sl-academy/production/backend \
    --secret-string '{
        "SUPABASE_SERVICE_KEY": "existing-key",
        "SESSION_SECRET_KEY": "new-secret",
        "OPENAI_API_KEY": "existing-key"
    }'

# 3. Deploy with gradual rollout
# - Keep old secret for 24 hours
# - Allow existing sessions to remain valid
# - New sessions use new secret

# 4. After 24 hours, remove old secret
```

#### 3. OpenAI API Key

```bash
# 1. Generate new API key in OpenAI Dashboard
# https://platform.openai.com/api-keys

# 2. Update secret in AWS Secrets Manager
aws secretsmanager update-secret \
    --secret-id sl-academy/production/backend \
    --secret-string '{
        "SUPABASE_SERVICE_KEY": "existing-key",
        "SESSION_SECRET_KEY": "existing-secret",
        "OPENAI_API_KEY": "new-key"
    }'

# 3. Restart application

# 4. Verify AI features work
curl -X POST http://localhost:8000/api/generate-recommendations \
    -H "Content-Type: application/json" \
    -d '{"postTestScore": 75}'

# 5. Revoke old key in OpenAI Dashboard
```

### Automated Rotation with AWS Secrets Manager

```python
# backend/scripts/rotate_secrets.py
import boto3
import secrets as py_secrets
from datetime import datetime, timedelta

def rotate_session_secret():
    """Rotate session secret key."""
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    # Get current secrets
    response = client.get_secret_value(SecretId='sl-academy/production/backend')
    current_secrets = json.loads(response['SecretString'])
    
    # Generate new session secret
    new_secret = py_secrets.token_urlsafe(32)
    
    # Update with new secret
    current_secrets['SESSION_SECRET_KEY'] = new_secret
    
    client.update_secret(
        SecretId='sl-academy/production/backend',
        SecretString=json.dumps(current_secrets)
    )
    
    print(f"Session secret rotated at {datetime.now()}")
    
    # Tag secret with rotation date
    client.tag_resource(
        SecretId='sl-academy/production/backend',
        Tags=[
            {'Key': 'LastRotated', 'Value': datetime.now().isoformat()},
            {'Key': 'NextRotation', 'Value': (datetime.now() + timedelta(days=90)).isoformat()}
        ]
    )

if __name__ == '__main__':
    rotate_session_secret()
```

**Schedule rotation**:
```bash
# Add to crontab (every 90 days)
0 2 1 */3 * cd /path/to/backend && python3 scripts/rotate_secrets.py >> logs/rotation.log 2>&1
```

## Access Control

### IAM Policy for Secrets Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:sl-academy/production/*"
      ]
    }
  ]
}
```

### Principle of Least Privilege

- **Backend application**: Read-only access to backend secrets
- **Frontend build**: Read-only access to frontend secrets
- **CI/CD pipeline**: Read-only access to all secrets
- **Developers**: No direct access to production secrets
- **DevOps team**: Full access for rotation and management

## Security Best Practices

### DO

- ✅ Use different secrets for dev/staging/production
- ✅ Rotate critical secrets every 90 days
- ✅ Use secrets manager for production
- ✅ Audit secret access regularly
- ✅ Encrypt secrets at rest and in transit
- ✅ Use IAM roles instead of access keys when possible
- ✅ Monitor for secret exposure in logs
- ✅ Implement secret rotation procedures
- ✅ Document all secrets and their purpose

### DON'T

- ❌ Commit secrets to git (use .gitignore)
- ❌ Share secrets via email or chat
- ❌ Use same secret across environments
- ❌ Store secrets in plain text files
- ❌ Log secrets in application logs
- ❌ Hardcode secrets in source code
- ❌ Use weak or predictable secrets
- ❌ Grant broad access to secrets

## Secret Generation

### Generate Strong Secrets

```bash
# Generate 32-character secret (recommended)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate 64-character secret (extra secure)
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Generate UUID
python3 -c "import uuid; print(str(uuid.uuid4()))"

# Generate hex secret
openssl rand -hex 32
```

### Secret Requirements

- **Minimum length**: 32 characters
- **Character set**: Alphanumeric + special characters
- **Entropy**: High randomness (use cryptographic RNG)
- **Uniqueness**: Different for each environment

## Monitoring and Auditing

### AWS CloudTrail Monitoring

Monitor secret access:
```bash
# View secret access logs
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=ResourceName,AttributeValue=sl-academy/production/backend \
    --max-results 50
```

### Alert on Suspicious Activity

```python
# backend/utils/secret_monitor.py
import boto3
from datetime import datetime, timedelta

def check_secret_access():
    """Check for suspicious secret access patterns."""
    client = boto3.client('cloudtrail', region_name='us-east-1')
    
    # Get events from last 24 hours
    response = client.lookup_events(
        LookupAttributes=[
            {
                'AttributeKey': 'ResourceName',
                'AttributeValue': 'sl-academy/production/backend'
            }
        ],
        StartTime=datetime.now() - timedelta(days=1),
        EndTime=datetime.now()
    )
    
    # Check for excessive access
    if len(response['Events']) > 100:
        send_alert(f"Excessive secret access: {len(response['Events'])} requests in 24h")
    
    # Check for access from unknown IPs
    known_ips = ['1.2.3.4', '5.6.7.8']
    for event in response['Events']:
        source_ip = event.get('SourceIPAddress')
        if source_ip not in known_ips:
            send_alert(f"Secret accessed from unknown IP: {source_ip}")
```

## Incident Response

### Secret Exposure Response

If a secret is exposed:

1. **Immediate Actions** (within 1 hour):
   - Rotate the exposed secret immediately
   - Revoke the old secret
   - Review access logs for unauthorized use
   - Deploy new secret to all environments

2. **Investigation** (within 24 hours):
   - Identify how secret was exposed
   - Check for data breaches or unauthorized access
   - Review all systems that used the secret
   - Document timeline of events

3. **Remediation** (within 1 week):
   - Fix root cause of exposure
   - Implement additional controls
   - Update documentation and procedures
   - Conduct team training

4. **Post-Incident** (within 2 weeks):
   - Conduct post-mortem
   - Update incident response procedures
   - Implement monitoring improvements
   - Share lessons learned

### Emergency Rotation

```bash
# Emergency rotation script
#!/bin/bash

echo "EMERGENCY SECRET ROTATION"
echo "========================="

# 1. Generate new secrets
NEW_SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# 2. Update AWS Secrets Manager
aws secretsmanager update-secret \
    --secret-id sl-academy/production/backend \
    --secret-string "{
        \"SUPABASE_SERVICE_KEY\": \"$SUPABASE_SERVICE_KEY\",
        \"SESSION_SECRET_KEY\": \"$NEW_SESSION_SECRET\",
        \"OPENAI_API_KEY\": \"$OPENAI_API_KEY\"
    }"

# 3. Restart application
kubectl rollout restart deployment/sl-academy-backend

# 4. Verify
sleep 30
curl http://localhost:8000/api/monitoring/health

echo "Emergency rotation complete"
```

## Migration from Environment Variables

### Step-by-Step Migration

1. **Audit current secrets**:
```bash
# List all secrets in .env
grep -E "^[A-Z_]+=" backend/.env | cut -d= -f1
```

2. **Create secrets in AWS Secrets Manager**:
```bash
# Create secret from .env file
python3 << EOF
import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv('backend/.env')

secrets = {
    'SUPABASE_SERVICE_KEY': os.getenv('SUPABASE_SERVICE_KEY'),
    'SESSION_SECRET_KEY': os.getenv('SESSION_SECRET_KEY'),
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
}

client = boto3.client('secretsmanager', region_name='us-east-1')
client.create_secret(
    Name='sl-academy/production/backend',
    SecretString=json.dumps(secrets)
)
print("Secrets migrated to AWS Secrets Manager")
EOF
```

3. **Update application code**:
```python
# backend/core/config.py
from core.secrets import get_secrets

# Old way
# SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# New way
secrets = get_secrets()
SUPABASE_SERVICE_KEY = secrets['SUPABASE_SERVICE_KEY']
```

4. **Test in staging**:
```bash
# Deploy to staging with new secrets
# Verify all functionality works
```

5. **Deploy to production**:
```bash
# Deploy to production
# Monitor for errors
```

6. **Remove .env files**:
```bash
# After successful deployment
rm backend/.env
rm frontend/.env.local
```

## References

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Support

For secrets management issues:
1. Check AWS Secrets Manager console
2. Review CloudTrail logs
3. Verify IAM permissions
4. Test secret retrieval manually
5. Contact DevOps team
6. Escalate to security team if needed
