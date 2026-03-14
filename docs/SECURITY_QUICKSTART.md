# Security Quick Reference

## Quick Security Checklist

### Before Deployment
- [ ] All secrets in AWS Secrets Manager (not .env files)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database RLS policies enabled and tested
- [ ] Rate limiting configured on all endpoints
- [ ] Security headers configured
- [ ] CORS origins whitelisted
- [ ] Audit logging enabled
- [ ] Backup and recovery tested
- [ ] Dependencies scanned for vulnerabilities
- [ ] Multi-tenant isolation tested

### Regular Maintenance
- [ ] Rotate secrets every 90 days
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Penetration testing annually

## Common Security Tasks

### Check for Vulnerabilities

```bash
# Frontend
cd frontend
npm audit

# Fix automatically
npm audit fix

# Backend
cd backend
pip install pip-audit
pip-audit
```

### Test RLS Policies

```sql
-- Test as Hospital A user
SET LOCAL app.current_hospital_id = 'hospital-a-uuid';
SELECT * FROM tracks;  -- Should only see Hospital A tracks

-- Test as Hospital B user
SET LOCAL app.current_hospital_id = 'hospital-b-uuid';
SELECT * FROM tracks;  -- Should only see Hospital B tracks
```

### Test Rate Limiting

```bash
# Test login rate limit (5 per 15 minutes)
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Attempt $i"
done
# 6th attempt should return 429
```

### Check Security Headers

```bash
curl -I https://your-domain.com | grep -E "(X-|Content-Security|Strict-Transport)"
```

### Review Audit Logs

```sql
-- Recent authentication failures
SELECT * FROM audit_logs
WHERE event_type = 'authentication_failure'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Cross-hospital access attempts
SELECT * FROM audit_logs
WHERE event_type = 'cross_hospital_access'
ORDER BY created_at DESC;
```

## Security Incident Response

### If Secret is Exposed

1. **Immediate** (within 1 hour):
```bash
# Rotate the secret
python3 backend/scripts/rotate_secrets.py

# Restart application
# Monitor logs for unauthorized access
```

2. **Investigation** (within 24 hours):
- Review audit logs for unauthorized access
- Check for data breaches
- Document timeline

3. **Remediation** (within 1 week):
- Fix root cause
- Update procedures
- Team training

### If Data Breach Suspected

1. **Immediate**:
- Isolate affected systems
- Preserve evidence
- Notify security team

2. **Investigation**:
- Review audit logs
- Identify scope of breach
- Document findings

3. **Notification**:
- Notify affected users (GDPR requirement)
- Report to authorities if required
- Update security measures

## Security Best Practices

### DO
- ✅ Use HTTPS everywhere
- ✅ Validate all inputs
- ✅ Sanitize user content
- ✅ Use parameterized queries
- ✅ Implement rate limiting
- ✅ Log security events
- ✅ Rotate secrets regularly
- ✅ Keep dependencies updated
- ✅ Test security regularly

### DON'T
- ❌ Store secrets in code
- ❌ Trust user input
- ❌ Use raw SQL queries
- ❌ Disable security features
- ❌ Ignore security warnings
- ❌ Skip security updates
- ❌ Use weak passwords
- ❌ Expose internal errors

## Quick Reference

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

### Rate Limits
- Login: 5 per 15 minutes
- Test submissions: 20 per hour
- Doubt submissions: 10 per hour
- Indicator imports: 1 per minute
- AI requests: 5 per hour

### Session Configuration
- Duration: 24 hours
- Cookie: HttpOnly, Secure, SameSite=Lax
- Encryption: iron-session with 32+ char secret

### File Upload Limits
- Images: 5MB (JPEG, PNG, WebP)
- Spreadsheets: 10MB (CSV, XLSX)
- Validation: Magic bytes + size

## Emergency Contacts

- **Security Team**: security@example.com
- **DevOps Team**: devops@example.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Supabase Support**: https://supabase.com/support

## Resources

- [Security Audit Report](./SECURITY_AUDIT.md)
- [Secrets Management Guide](./SECRETS_MANAGEMENT.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
