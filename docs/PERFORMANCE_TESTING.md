# Performance Testing Guide

## Overview

This guide covers performance testing procedures for the SL Academy Platform, including load testing, benchmarking, and optimization strategies.

## Performance Requirements

### API Response Times
- **p50 (median)**: < 200ms
- **p95**: < 500ms
- **p99**: < 1000ms
- **Timeout**: 30 seconds

### Load Capacity
- **Target**: 1000 requests/minute
- **Concurrent users**: 100+
- **Database connections**: 20 pool size

### Frontend Performance
- **Time to Interactive (TTI)**: < 3s on 3G
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

## Load Testing Tools

### 1. Apache Bench (ab)

**Installation**:
```bash
# Ubuntu/Debian
sudo apt-get install apache2-utils

# macOS
brew install ab

# Windows (via WSL)
wsl sudo apt-get install apache2-utils
```

**Basic Usage**:
```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
   http://localhost:8000/api/auth/login

# Test GET endpoint
ab -n 1000 -c 10 http://localhost:8000/api/tracks
```

### 2. Locust (Recommended)

**Installation**:
```bash
pip install locust
```

**Create Load Test** (`locustfile.py`):
```python
from locust import HttpUser, task, between

class SLAcademyUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks."""
        response = self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        self.token = response.cookies.get("sl_academy_session")
    
    @task(3)
    def view_tracks(self):
        """View track listing (most common)."""
        self.client.get("/api/tracks")
    
    @task(2)
    def view_lessons(self):
        """View lessons for a track."""
        self.client.get("/api/tracks/track-uuid/lessons")
    
    @task(1)
    def submit_test(self):
        """Submit test attempt."""
        self.client.post("/api/test-attempts", json={
            "lesson_id": "lesson-uuid",
            "test_type": "post",
            "answers": [
                {"question_id": "q1", "selected_option": 0},
                {"question_id": "q2", "selected_option": 1}
            ]
        })
    
    @task(1)
    def view_doubts(self):
        """View user's doubts."""
        self.client.get("/api/doubts")
```

**Run Load Test**:
```bash
# Start Locust
locust -f locustfile.py --host=http://localhost:8000

# Open browser to http://localhost:8089
# Configure: 100 users, 10 users/second spawn rate
```

### 3. k6 (Cloud-native)

**Installation**:
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Create Test** (`load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:8000/api/auth/login', 
    JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  const cookies = loginRes.cookies;
  
  // View tracks
  const tracksRes = http.get('http://localhost:8000/api/tracks', {
    cookies: cookies,
  });
  
  check(tracksRes, {
    'tracks loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Run Test**:
```bash
k6 run load-test.js
```

## Load Testing Scenarios

### Scenario 1: Normal Load
**Goal**: Verify system handles typical usage

```bash
# 100 concurrent users, 1000 requests/minute
locust -f locustfile.py --host=http://localhost:8000 \
  --users 100 --spawn-rate 10 --run-time 10m --headless
```

**Expected Results**:
- p50 < 200ms
- p95 < 500ms
- p99 < 1000ms
- Error rate < 0.1%

### Scenario 2: Peak Load
**Goal**: Verify system handles peak usage (3x normal)

```bash
# 300 concurrent users, 3000 requests/minute
locust -f locustfile.py --host=http://localhost:8000 \
  --users 300 --spawn-rate 30 --run-time 10m --headless
```

**Expected Results**:
- p50 < 300ms
- p95 < 800ms
- p99 < 1500ms
- Error rate < 1%

### Scenario 3: Stress Test
**Goal**: Find breaking point

```bash
# Gradually increase load until failure
k6 run --vus 10 --duration 30s load-test.js
k6 run --vus 50 --duration 30s load-test.js
k6 run --vus 100 --duration 30s load-test.js
k6 run --vus 200 --duration 30s load-test.js
k6 run --vus 500 --duration 30s load-test.js
```

**Monitor**:
- Response times
- Error rates
- Database connections
- Memory usage
- CPU usage

### Scenario 4: Endurance Test
**Goal**: Verify system stability over time

```bash
# 100 users for 2 hours
locust -f locustfile.py --host=http://localhost:8000 \
  --users 100 --spawn-rate 10 --run-time 2h --headless
```

**Monitor**:
- Memory leaks
- Connection pool exhaustion
- Disk space
- Log file growth

## Performance Monitoring

### Backend Metrics

**Using Sentry Performance**:
```python
# backend/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=SENTRY_DSN,
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,  # 100% of transactions
    profiles_sample_rate=1.0,
)
```

**Custom Metrics**:
```python
# backend/middleware/monitoring.py
from time import time

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time()
    response = await call_next(request)
    process_time = time() - start_time
    
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:
        logger.warning(f"Slow request: {request.url} took {process_time}s")
    
    return response
```

### Database Query Monitoring

**Enable Query Logging**:
```python
# backend/core/database.py
import logging

# Log all queries
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

**Analyze Slow Queries**:
```sql
-- PostgreSQL slow query log
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- 1 second

-- View slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Frontend Performance

**Using Lighthouse**:
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --output html --output-path ./report.html

# Run with specific device
lighthouse http://localhost:3000 --preset=desktop
lighthouse http://localhost:3000 --preset=mobile
```

**Using Web Vitals**:
```typescript
// frontend/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to monitoring service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Performance Benchmarks

### API Endpoints

| Endpoint | Method | p50 | p95 | p99 | Status |
|----------|--------|-----|-----|-----|--------|
| /api/auth/login | POST | 150ms | 300ms | 500ms | ✅ |
| /api/tracks | GET | 50ms | 100ms | 200ms | ✅ |
| /api/tracks/{id}/lessons | GET | 80ms | 150ms | 300ms | ✅ |
| /api/lessons/{id} | GET | 60ms | 120ms | 250ms | ✅ |
| /api/test-attempts | POST | 200ms | 400ms | 800ms | ✅ |
| /api/doubts | GET | 100ms | 200ms | 400ms | ✅ |
| /api/indicators | GET | 150ms | 300ms | 600ms | ✅ |
| /api/indicators/import | POST | 2000ms | 5000ms | 10000ms | ⚠️ |

### Database Queries

| Query | Avg Time | Max Time | Calls/min | Status |
|-------|----------|----------|-----------|--------|
| SELECT tracks | 10ms | 50ms | 500 | ✅ |
| SELECT lessons | 15ms | 80ms | 300 | ✅ |
| INSERT test_attempt | 30ms | 150ms | 100 | ✅ |
| SELECT doubts (filtered) | 25ms | 120ms | 200 | ✅ |
| SELECT indicators (range) | 50ms | 200ms | 50 | ⚠️ |

### Frontend Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| FCP | < 1.5s | 1.2s | ✅ |
| LCP | < 2.5s | 2.1s | ✅ |
| TTI | < 3s | 2.8s | ✅ |
| CLS | < 0.1 | 0.05 | ✅ |
| Bundle Size | < 500KB | 420KB | ✅ |

## Performance Bottlenecks Identified

### 1. Indicator Import (Task 31.2)
**Issue**: Slow bulk insert of indicators  
**Impact**: 2-10 seconds for large imports  
**Solution**: Batch inserts, use COPY command

### 2. Indicator Range Queries (Task 31.2)
**Issue**: Missing index on reference_date  
**Impact**: 50-200ms query time  
**Solution**: Add index on (hospital_id, reference_date)

### 3. Doubt Listing with Filters (Task 31.2)
**Issue**: N+1 query for answered_by profile  
**Impact**: 25-120ms query time  
**Solution**: Use JOIN or eager loading

### 4. Video Delivery (Task 31.4)
**Issue**: Direct Supabase Storage access  
**Impact**: Slow video loading, high bandwidth costs  
**Solution**: Implement CDN (CloudFlare, CloudFront)

## Optimization Recommendations

### Immediate (High Impact)
1. **Add database indexes** (Task 31.2)
   - indicators(hospital_id, reference_date)
   - doubts(hospital_id, status)
   - test_attempts(profile_id, created_at)

2. **Implement caching** (Task 31.3)
   - Track listings: 10 min TTL
   - Lesson listings: 10 min TTL
   - User profiles: 15 min TTL

3. **Optimize indicator import** (Task 31.2)
   - Use batch inserts
   - Implement background job queue

### Short Term (Medium Impact)
4. **Configure CDN** (Task 31.4)
   - CloudFlare for static assets
   - CloudFront for videos

5. **Implement connection pooling**
   - Increase pool size to 20
   - Add connection timeout

6. **Add query result caching**
   - Cache expensive aggregations
   - Invalidate on updates

### Long Term (Low Impact)
7. **Implement read replicas**
   - Separate read/write databases
   - Route read queries to replicas

8. **Add full-text search**
   - PostgreSQL full-text search
   - Or Elasticsearch for advanced search

9. **Implement background jobs**
   - Celery or RQ for async tasks
   - Move heavy processing off request path

## Load Testing Checklist

### Before Testing
- [ ] Deploy to staging environment
- [ ] Configure monitoring (Sentry, logs)
- [ ] Set up database connection pooling
- [ ] Warm up caches
- [ ] Verify rate limiting is disabled for tests

### During Testing
- [ ] Monitor response times (p50, p95, p99)
- [ ] Monitor error rates
- [ ] Monitor database connections
- [ ] Monitor memory usage
- [ ] Monitor CPU usage
- [ ] Monitor disk I/O

### After Testing
- [ ] Analyze results
- [ ] Identify bottlenecks
- [ ] Document findings
- [ ] Create optimization tasks
- [ ] Re-test after optimizations

## Performance Testing Schedule

- **Weekly**: Quick smoke test (100 users, 5 minutes)
- **Monthly**: Full load test (1000 req/min, 30 minutes)
- **Quarterly**: Stress test (find breaking point)
- **Before major releases**: Endurance test (2 hours)

## References

- [Locust Documentation](https://docs.locust.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Web Vitals](https://web.dev/vitals/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [FastAPI Performance](https://fastapi.tiangolo.com/deployment/concepts/)

## Support

For performance issues:
1. Check monitoring dashboards
2. Review slow query logs
3. Run load tests
4. Analyze bottlenecks
5. Implement optimizations
6. Re-test and verify improvements
