# Monitoring and Alerting Guide

## Overview

The SL Academy Platform includes comprehensive monitoring and alerting capabilities to track application health, performance, and errors in real-time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Backend    │  │   Frontend   │  │  Database    │      │
│  │   (FastAPI)  │  │  (Next.js)   │  │  (Supabase)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Monitoring Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Sentry    │  │   Metrics    │  │    Logs      │      │
│  │ Error Track  │  │  Collection  │  │  Aggregation │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Alerting Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Slack     │  │    Email     │  │   Webhook    │      │
│  │  Notifications│  │    Alerts    │  │   Custom     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Error Tracking (Sentry)

**Purpose**: Capture and track application errors and exceptions.

**Features**:
- Automatic error capture
- Stack traces and context
- User context tracking
- Performance monitoring
- Session replay (frontend)

**Configuration**:

Backend (`backend/.env`):
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 2. Metrics Collection

**Purpose**: Track application metrics and performance indicators.

**Metrics Tracked**:
- HTTP request count and duration
- Error rates
- API response times (p50, p95, p99)
- Database query performance
- System resources (CPU, memory, disk)

**Access**: `GET /api/monitoring/metrics` (manager only)

### 3. Health Checks

**Purpose**: Monitor application and dependency health.

**Endpoints**:
- `GET /api/monitoring/health` - Overall health status
- `GET /api/monitoring/readiness` - Kubernetes readiness probe
- `GET /api/monitoring/liveness` - Kubernetes liveness probe

**Health Checks**:
- Database connectivity
- Sentry configuration
- System resources

### 4. Alerting System

**Purpose**: Send alerts for critical events and threshold violations.

**Alert Channels**:
- Slack webhooks
- Email notifications
- Custom webhooks
- Log files

**Alert Severities**:
- INFO: Informational messages
- WARNING: Warning conditions
- ERROR: Error conditions
- CRITICAL: Critical failures

## Setup Instructions

### 1. Set Up Sentry

1. Create account at [sentry.io](https://sentry.io)
2. Create new project for backend (Python/FastAPI)
3. Create new project for frontend (Next.js)
4. Copy DSN from project settings
5. Add to environment variables

### 2. Configure Slack Alerts

1. Create Slack webhook:
   - Go to Slack App Directory
   - Search for "Incoming Webhooks"
   - Add to workspace
   - Copy webhook URL

2. Add to backend `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Configure Email Alerts

Add to backend `.env`:
```env
ALERT_EMAIL=alerts@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. Initialize Monitoring

Backend (`backend/main.py`):
```python
from core.monitoring import init_sentry
from middleware.monitoring import MonitoringMiddleware, HealthCheckMiddleware

# Initialize Sentry
init_sentry()

# Add middleware
app.add_middleware(MonitoringMiddleware)
app.add_middleware(HealthCheckMiddleware)
```

Frontend (`frontend/app/layout.tsx`):
```typescript
import { initSentry } from '@/lib/monitoring'

// Initialize on app start
if (typeof window !== 'undefined') {
  initSentry()
}
```

## Alert Rules

### Pre-configured Rules

1. **High Error Rate**
   - Condition: Error rate > 5%
   - Severity: ERROR
   - Cooldown: 5 minutes

2. **Slow API Response**
   - Condition: p95 response time > 1000ms
   - Severity: WARNING
   - Cooldown: 5 minutes

3. **High Memory Usage**
   - Condition: Memory usage > 90%
   - Severity: CRITICAL
   - Cooldown: 5 minutes

4. **Database Connection Errors**
   - Condition: Connection errors > 10
   - Severity: CRITICAL
   - Cooldown: 5 minutes

### Custom Alert Rules

Create custom rules in `backend/core/alerts.py`:

```python
from core.alerts import AlertRule, AlertSeverity

custom_rule = AlertRule(
    name="custom_metric_threshold",
    condition=lambda m: m.get("custom_metric", 0) > 100,
    severity=AlertSeverity.WARNING,
    message_template="Custom metric exceeded: {custom_metric}",
    cooldown_seconds=300,
)

ALERT_RULES.append(custom_rule)
```

## Usage Examples

### Backend Error Tracking

```python
from core.monitoring import capture_exception, add_breadcrumb, set_user_context

# Set user context
set_user_context(
    user_id="user-123",
    email="user@example.com",
    hospital_id="hospital-456"
)

# Add breadcrumb
add_breadcrumb(
    message="User performed action",
    category="user_action",
    level="info",
    data={"action": "create_track"}
)

# Capture exception
try:
    # Some operation
    pass
except Exception as e:
    capture_exception(e, context={
        "operation": "create_track",
        "track_id": "track-789"
    })
```

### Frontend Error Tracking

```typescript
import { captureException, addBreadcrumb, setUserContext } from '@/lib/monitoring'

// Set user context
setUserContext('user-123', 'user@example.com', 'hospital-456')

// Add breadcrumb
addBreadcrumb('User clicked button', 'ui', 'info', { button: 'submit' })

// Capture exception
try {
  // Some operation
} catch (error) {
  captureException(error as Error, {
    component: 'TrackForm',
    action: 'submit'
  })
}
```

### Performance Monitoring

```python
from core.monitoring import monitor_performance, PerformanceMonitor

# Decorator
@monitor_performance("database_query")
async def fetch_tracks():
    # Query logic
    pass

# Context manager
with PerformanceMonitor("complex_operation", "Processing data"):
    # Complex operation
    pass
```

### Sending Alerts

```python
from core.alerts import send_error_alert, send_critical_alert

# Send error alert
await send_error_alert(
    title="API Error",
    message="Failed to process request",
    tags={"endpoint": "/api/tracks", "method": "POST"},
    metadata={"error_code": "500", "user_id": "user-123"}
)

# Send critical alert
await send_critical_alert(
    title="Database Connection Lost",
    message="Unable to connect to database",
    tags={"service": "database"},
)
```

## Monitoring Dashboard

### Access Metrics

```bash
# Get application metrics
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/metrics

# Get system metrics
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/system

# Health check
curl http://localhost:8000/api/monitoring/health
```

### Sentry Dashboard

1. Go to [sentry.io](https://sentry.io)
2. Select your project
3. View:
   - Issues: All captured errors
   - Performance: Transaction traces
   - Releases: Deploy tracking
   - Alerts: Configured alerts

## Best Practices

### 1. Error Handling

```python
# DO: Capture with context
try:
    result = perform_operation()
except SpecificError as e:
    capture_exception(e, context={
        "operation": "specific_operation",
        "input": sanitized_input
    })
    raise

# DON'T: Capture without context
try:
    result = perform_operation()
except Exception as e:
    capture_exception(e)
    raise
```

### 2. Breadcrumbs

```python
# DO: Add meaningful breadcrumbs
add_breadcrumb("User login attempt", "auth", "info", {
    "email_hash": hash_email(email),
    "ip": request.client.host
})

# DON'T: Add sensitive data
add_breadcrumb("User login", "auth", "info", {
    "email": email,  # ❌ PII
    "password": password  # ❌ Sensitive
})
```

### 3. Performance Monitoring

```python
# DO: Monitor critical paths
@monitor_performance("critical_operation")
async def critical_operation():
    pass

# DON'T: Monitor everything
@monitor_performance("trivial_operation")  # ❌ Overhead
def get_constant():
    return 42
```

### 4. Alert Fatigue

```python
# DO: Use cooldowns
AlertRule(
    name="error_rate",
    condition=lambda m: m.get("error_rate") > 0.05,
    severity=AlertSeverity.ERROR,
    cooldown_seconds=300  # ✅ 5 minutes
)

# DON'T: Alert on every occurrence
AlertRule(
    name="single_error",
    condition=lambda m: m.get("errors") > 0,
    severity=AlertSeverity.CRITICAL,
    cooldown_seconds=0  # ❌ Alert spam
)
```

## Troubleshooting

### Sentry Not Capturing Errors

**Check**:
1. SENTRY_DSN is configured
2. Sentry is initialized (`init_sentry()` called)
3. Network connectivity to sentry.io
4. Error is not caught and suppressed

**Debug**:
```python
import sentry_sdk
sentry_sdk.capture_message("Test message")
```

### Alerts Not Sending

**Check**:
1. Alert channels are configured (SLACK_WEBHOOK_URL, etc.)
2. Alert rules are registered
3. Cooldown period hasn't expired
4. Network connectivity

**Debug**:
```python
from core.alerts import send_info_alert
await send_info_alert("Test alert", "Testing alert system")
```

### High Memory Usage

**Check**:
1. Metrics collection not accumulating
2. Sentry breadcrumbs not exceeding limit
3. Database connections being closed

**Fix**:
```python
# Reset metrics periodically
from core.monitoring import metrics
metrics.reset()
```

## Performance Impact

### Sentry

- **Overhead**: < 1% CPU, < 50MB memory
- **Network**: ~1KB per error, ~10KB per transaction
- **Sampling**: Configure `SENTRY_TRACES_SAMPLE_RATE` (default: 0.1 = 10%)

### Metrics Collection

- **Overhead**: < 0.5% CPU, < 10MB memory
- **Storage**: In-memory, reset periodically

### Monitoring Middleware

- **Overhead**: < 1ms per request
- **Impact**: Negligible on p95 response time

## Security Considerations

### 1. PII Protection

```python
# DO: Hash or redact PII
set_user_context(
    user_id="user-123",
    email_hash=hash_email(email),  # ✅ Hashed
    hospital_id="hospital-456"
)

# DON'T: Send raw PII
set_user_context(
    user_id="user-123",
    email=email,  # ❌ Raw email
    phone=phone  # ❌ Raw phone
)
```

### 2. Sensitive Data

```python
# DO: Sanitize before capturing
capture_exception(e, context={
    "input": sanitize_input(user_input)  # ✅ Sanitized
})

# DON'T: Include sensitive data
capture_exception(e, context={
    "password": password,  # ❌ Sensitive
    "api_key": api_key  # ❌ Secret
})
```

### 3. Access Control

- Metrics endpoints require manager role
- Health check is public (no sensitive data)
- System metrics require authentication

## Cost Optimization

### Sentry

- Free tier: 5,000 errors/month, 10,000 transactions/month
- Paid: $26/month for 50K errors, 100K transactions
- Optimize: Adjust sample rates, filter noise

### Slack

- Free: Unlimited webhooks
- Rate limit: ~1 message/second

### Custom Monitoring

- Self-hosted: Prometheus + Grafana (free, requires infrastructure)
- Cloud: Datadog, New Relic (paid, managed)

## References

- [Sentry Documentation](https://docs.sentry.io/)
- [FastAPI Monitoring](https://fastapi.tiangolo.com/advanced/middleware/)
- [Next.js Monitoring](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

## Support

For monitoring issues:
1. Check Sentry dashboard for errors
2. Review application logs
3. Verify configuration
4. Test alert delivery
5. Contact DevOps team

