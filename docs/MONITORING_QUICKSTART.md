# Monitoring Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies

```bash
# Backend
cd backend
pip install sentry-sdk[fastapi] psutil aiohttp

# Frontend
cd frontend
npm install @sentry/nextjs
```

### 2. Configure Sentry

1. Create free account at [sentry.io](https://sentry.io)
2. Create two projects:
   - Backend (Python/FastAPI)
   - Frontend (Next.js)
3. Copy DSN from each project

### 3. Add Environment Variables

**Backend** (`backend/.env`):
```env
# Monitoring
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_EMAIL=alerts@yourdomain.com
```

**Frontend** (`frontend/.env.local`):
```env
# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 4. Initialize Monitoring

**Backend** (`backend/main.py`):
```python
from core.monitoring import init_sentry
from middleware.monitoring import MonitoringMiddleware

# Initialize Sentry
init_sentry()

# Add monitoring middleware
app.add_middleware(MonitoringMiddleware)

# Include monitoring routes
from api.routes import monitoring
app.include_router(monitoring.router)
```

**Frontend** (`frontend/app/layout.tsx`):
```typescript
import { initSentry } from '@/lib/monitoring'

// Initialize on client side
if (typeof window !== 'undefined') {
  initSentry()
}
```

## Quick Test

### Test Error Tracking

**Backend**:
```bash
curl http://localhost:8000/api/test-error
```

**Frontend**:
```javascript
// In browser console
throw new Error('Test error')
```

Check Sentry dashboard for captured errors.

### Test Health Check

```bash
curl http://localhost:8000/api/monitoring/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": true,
    "sentry": true
  }
}
```

### Test Metrics

```bash
# Login as manager first, then:
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/metrics
```

## Common Tasks

### View Errors in Sentry

1. Go to [sentry.io](https://sentry.io)
2. Select project
3. Click "Issues"
4. View error details, stack traces, and context

### Set Up Slack Alerts

1. Go to Slack App Directory
2. Add "Incoming Webhooks"
3. Copy webhook URL
4. Add to `SLACK_WEBHOOK_URL` in `.env`
5. Restart backend

Test:
```python
from core.alerts import send_info_alert
await send_info_alert("Test", "Testing Slack integration")
```

### Monitor Performance

**View slow requests**:
```bash
# Check logs for "Slow request" warnings
tail -f backend/logs/app.log | grep "Slow request"
```

**View metrics**:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/system
```

### Create Custom Alert

Edit `backend/core/alerts.py`:
```python
AlertRule(
    name="custom_alert",
    condition=lambda m: m.get("custom_metric", 0) > 100,
    severity=AlertSeverity.WARNING,
    message_template="Custom metric: {custom_metric}",
    cooldown_seconds=300,
)
```

## Alert Rules

| Rule | Condition | Severity | Action |
|------|-----------|----------|--------|
| High Error Rate | > 5% | ERROR | Investigate errors in Sentry |
| Slow API | p95 > 1s | WARNING | Check slow queries |
| High Memory | > 90% | CRITICAL | Restart or scale up |
| DB Errors | > 10 | CRITICAL | Check database connection |

## Troubleshooting

### Sentry Not Working

```bash
# Check configuration
echo $SENTRY_DSN

# Test manually
python -c "import sentry_sdk; sentry_sdk.init('$SENTRY_DSN'); sentry_sdk.capture_message('test')"
```

### Alerts Not Sending

```bash
# Check Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}'
```

### High Memory Usage

```bash
# Check metrics
curl http://localhost:8000/api/monitoring/system

# Reset metrics if needed
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/reset-metrics
```

## Next Steps

1. Configure alert thresholds for your needs
2. Set up custom dashboards in Sentry
3. Integrate with your incident management system
4. Set up log aggregation (ELK, Datadog, etc.)
5. Configure uptime monitoring (UptimeRobot, Pingdom)

## Resources

- [Full Monitoring Guide](./MONITORING_AND_ALERTING.md)
- [Sentry Documentation](https://docs.sentry.io/)
- [Alert Configuration](./MONITORING_AND_ALERTING.md#alert-rules)

## Support

For monitoring issues:
- Check Sentry dashboard
- Review application logs
- Test health endpoints
- Contact DevOps team
