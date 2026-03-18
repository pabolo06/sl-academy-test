# Caching Strategy

## Overview

This document outlines the caching strategy for the SL Academy Platform to improve performance, reduce database load, and enhance user experience.

## Caching Layers

### 1. Browser Cache (Client-Side)
- Static assets (CSS, JS, images)
- API responses (via SWR)
- Video metadata

### 2. CDN Cache (Edge)
- Static assets
- Video files
- Public API responses

### 3. Application Cache (Server-Side)
- Database query results
- Computed values
- Session data

### 4. Database Cache (PostgreSQL)
- Query result cache
- Prepared statements

## Cache Configuration

### Frontend Caching (SWR)

**Already Implemented** ✅

```typescript
// frontend/lib/api.ts
import useSWR from 'swr';

// Default SWR configuration
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

// Tracks listing (10 min cache)
export function useTracks() {
  return useSWR('/api/tracks', fetcher, {
    ...swrConfig,
    refreshInterval: 600000, // 10 minutes
  });
}

// Lessons listing (10 min cache)
export function useLessons(trackId: string) {
  return useSWR(`/api/tracks/${trackId}/lessons`, fetcher, {
    ...swrConfig,
    refreshInterval: 600000, // 10 minutes
  });
}

// User profile (15 min cache)
export function useProfile() {
  return useSWR('/api/auth/me', fetcher, {
    ...swrConfig,
    refreshInterval: 900000, // 15 minutes
  });
}

// Doubts (5 min cache, more dynamic)
export function useDoubts() {
  return useSWR('/api/doubts', fetcher, {
    ...swrConfig,
    refreshInterval: 300000, // 5 minutes
  });
}
```

### Backend Caching (Redis)

**To Implement**:

```python
# backend/core/cache.py
import redis
import json
from typing import Optional, Any
from functools import wraps
import hashlib

# Redis connection
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments."""
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()

def cached(ttl: int = 300, prefix: str = ''):
    """
    Cache decorator for functions.
    
    Args:
        ttl: Time to live in seconds
        prefix: Cache key prefix
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = redis_client.get(key)
            if cached_value:
                return json.loads(cached_value)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            redis_client.setex(
                key,
                ttl,
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: str):
    """Invalidate cache keys matching pattern."""
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)
```

## Caching Rules

### What to Cache

| Data Type | TTL | Invalidation | Priority |
|-----------|-----|--------------|----------|
| Track listings | 10 min | On create/update/delete | High |
| Lesson listings | 10 min | On create/update/delete | High |
| User profiles | 15 min | On update | High |
| Test questions | 30 min | On update | Medium |
| Indicator data | 5 min | On import | Medium |
| Doubt listings | 5 min | On create/answer | Medium |
| Dashboard stats | 10 min | On data change | Low |
| Static content | 1 day | On deploy | Low |

### What NOT to Cache

- Authentication requests
- Test submissions
- File uploads
- Real-time data
- User-specific sensitive data
- Audit logs

## Cache Implementation

### 1. Track Listings

```python
# backend/api/routes/tracks.py
from core.cache import cached, invalidate_cache

@router.get("/tracks")
@cached(ttl=600, prefix="tracks")  # 10 minutes
async def get_tracks(hospital_id: str):
    result = supabase.table('tracks') \
        .select('*') \
        .eq('hospital_id', hospital_id) \
        .is_('deleted_at', 'null') \
        .execute()
    return result.data

@router.post("/tracks")
async def create_track(track: TrackCreate, hospital_id: str):
    # Create track
    result = supabase.table('tracks').insert(track.dict()).execute()
    
    # Invalidate cache
    invalidate_cache(f"tracks:get_tracks:*{hospital_id}*")
    
    return result.data

@router.patch("/tracks/{track_id}")
async def update_track(track_id: str, track: TrackUpdate, hospital_id: str):
    # Update track
    result = supabase.table('tracks') \
        .update(track.dict(exclude_unset=True)) \
        .eq('id', track_id) \
        .execute()
    
    # Invalidate cache
    invalidate_cache(f"tracks:get_tracks:*{hospital_id}*")
    invalidate_cache(f"lessons:get_lessons:*{track_id}*")
    
    return result.data
```

### 2. Lesson Listings

```python
# backend/api/routes/lessons.py
from core.cache import cached, invalidate_cache

@router.get("/tracks/{track_id}/lessons")
@cached(ttl=600, prefix="lessons")  # 10 minutes
async def get_lessons(track_id: str):
    result = supabase.table('lessons') \
        .select('*') \
        .eq('track_id', track_id) \
        .is_('deleted_at', 'null') \
        .order('order') \
        .execute()
    return result.data

@router.post("/lessons")
async def create_lesson(lesson: LessonCreate):
    # Create lesson
    result = supabase.table('lessons').insert(lesson.dict()).execute()
    
    # Invalidate cache
    invalidate_cache(f"lessons:get_lessons:*{lesson.track_id}*")
    
    return result.data
```

### 3. User Profiles

```python
# backend/api/routes/auth.py
from core.cache import cached, invalidate_cache

@router.get("/auth/me")
@cached(ttl=900, prefix="profiles")  # 15 minutes
async def get_profile(user_id: str):
    result = supabase.table('profiles') \
        .select('*') \
        .eq('id', user_id) \
        .single() \
        .execute()
    return result.data

@router.patch("/auth/me")
async def update_profile(profile: ProfileUpdate, user_id: str):
    # Update profile
    result = supabase.table('profiles') \
        .update(profile.dict(exclude_unset=True)) \
        .eq('id', user_id) \
        .execute()
    
    # Invalidate cache
    invalidate_cache(f"profiles:get_profile:*{user_id}*")
    
    return result.data
```

### 4. Dashboard Statistics

```python
# backend/api/routes/dashboard.py
from core.cache import cached

@router.get("/dashboard/stats")
@cached(ttl=600, prefix="dashboard")  # 10 minutes
async def get_dashboard_stats(hospital_id: str):
    # Expensive aggregation queries
    stats = {
        'total_users': count_users(hospital_id),
        'total_tracks': count_tracks(hospital_id),
        'total_lessons': count_lessons(hospital_id),
        'avg_test_score': avg_test_score(hospital_id),
        'completion_rate': completion_rate(hospital_id),
    }
    return stats
```

## Cache Invalidation Strategies

### 1. Time-Based (TTL)

**Use for**: Data that changes infrequently

```python
# Cache expires after TTL
@cached(ttl=600)  # 10 minutes
async def get_tracks():
    pass
```

### 2. Event-Based

**Use for**: Data that changes on specific events

```python
# Invalidate on create/update/delete
@router.post("/tracks")
async def create_track(track: TrackCreate):
    result = create_track_in_db(track)
    invalidate_cache("tracks:*")  # Invalidate all track caches
    return result
```

### 3. Manual

**Use for**: Complex invalidation logic

```python
# Invalidate related caches
def invalidate_track_caches(track_id: str, hospital_id: str):
    invalidate_cache(f"tracks:*{hospital_id}*")
    invalidate_cache(f"lessons:*{track_id}*")
    invalidate_cache(f"dashboard:*{hospital_id}*")
```

### 4. Cache-Aside Pattern

**Use for**: Most common pattern

```python
async def get_data(key: str):
    # 1. Try cache
    cached = redis_client.get(key)
    if cached:
        return cached
    
    # 2. Query database
    data = query_database()
    
    # 3. Store in cache
    redis_client.setex(key, ttl, data)
    
    return data
```

## Cache Monitoring

### Redis Monitoring

```python
# backend/api/routes/monitoring.py

@router.get("/monitoring/cache")
async def get_cache_stats():
    info = redis_client.info()
    return {
        'used_memory': info['used_memory_human'],
        'connected_clients': info['connected_clients'],
        'total_commands_processed': info['total_commands_processed'],
        'keyspace_hits': info['keyspace_hits'],
        'keyspace_misses': info['keyspace_misses'],
        'hit_rate': info['keyspace_hits'] / (info['keyspace_hits'] + info['keyspace_misses']) * 100
    }
```

### Cache Hit Rate

```python
# Track cache performance
def track_cache_hit(key: str, hit: bool):
    metric_key = f"cache_metrics:{datetime.now().strftime('%Y-%m-%d')}"
    redis_client.hincrby(metric_key, 'hits' if hit else 'misses', 1)
    redis_client.expire(metric_key, 86400 * 7)  # Keep for 7 days
```

## CDN Configuration

### CloudFlare Configuration

```yaml
# cloudflare-cache-rules.yaml
rules:
  - name: Cache static assets
    match: "*.{js,css,png,jpg,jpeg,gif,ico,svg,woff,woff2}"
    cache_level: aggressive
    edge_cache_ttl: 2592000  # 30 days
    browser_cache_ttl: 2592000
  
  - name: Cache API responses
    match: "/api/tracks*"
    cache_level: standard
    edge_cache_ttl: 600  # 10 minutes
    browser_cache_ttl: 300  # 5 minutes
  
  - name: Cache video files
    match: "/videos/*"
    cache_level: aggressive
    edge_cache_ttl: 86400  # 1 day
    browser_cache_ttl: 3600  # 1 hour
```

### Cache Headers

```python
# backend/middleware/cache_headers.py

@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Static assets
    if request.url.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'public, max-age=2592000'  # 30 days
    
    # API responses (cacheable)
    elif request.url.path.startswith('/api/tracks'):
        response.headers['Cache-Control'] = 'public, max-age=600'  # 10 minutes
    
    # API responses (non-cacheable)
    elif request.url.path.startswith('/api/auth'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    
    return response
```

## Cache Warming

### Pre-populate Cache

```python
# backend/scripts/warm_cache.py

async def warm_cache():
    """Pre-populate cache with frequently accessed data."""
    
    # Get all hospitals
    hospitals = get_all_hospitals()
    
    for hospital in hospitals:
        # Warm track cache
        tracks = await get_tracks(hospital.id)
        
        # Warm lesson cache for each track
        for track in tracks:
            lessons = await get_lessons(track.id)
        
        # Warm dashboard stats
        stats = await get_dashboard_stats(hospital.id)
    
    print(f"Cache warmed for {len(hospitals)} hospitals")

# Run on application startup
@app.on_event("startup")
async def startup_event():
    await warm_cache()
```

## Cache Best Practices

### DO

- ✅ Cache frequently accessed data
- ✅ Use appropriate TTL values
- ✅ Invalidate cache on data changes
- ✅ Monitor cache hit rates
- ✅ Use cache keys with namespaces
- ✅ Implement cache warming for critical data
- ✅ Set cache size limits
- ✅ Use compression for large values

### DON'T

- ❌ Cache sensitive data without encryption
- ❌ Cache user-specific data globally
- ❌ Use very long TTLs for dynamic data
- ❌ Forget to invalidate cache
- ❌ Cache everything (be selective)
- ❌ Ignore cache memory limits
- ❌ Cache data that changes frequently

## Performance Impact

### Expected Improvements

| Endpoint | Before Cache | After Cache | Improvement |
|----------|--------------|-------------|-------------|
| GET /api/tracks | 50ms | 5ms | 10x faster |
| GET /api/lessons | 80ms | 8ms | 10x faster |
| GET /api/auth/me | 60ms | 6ms | 10x faster |
| GET /api/dashboard/stats | 300ms | 30ms | 10x faster |

### Database Load Reduction

- **Before**: 1000 queries/minute
- **After**: 200 queries/minute (80% reduction)
- **Cache hit rate target**: 80%+

## Redis Setup

### Installation

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows (via WSL)
wsl sudo apt-get install redis-server

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Configuration

```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Python Client

```bash
# Install Redis client
pip install redis

# Add to requirements.txt
echo "redis>=5.0.0" >> backend/requirements.txt
```

## Cache Testing

### Test Cache Hit

```python
# backend/tests/test_cache.py
import pytest
from core.cache import cached, redis_client

@pytest.mark.asyncio
async def test_cache_hit():
    # Clear cache
    redis_client.flushdb()
    
    # First call - cache miss
    result1 = await get_tracks('hospital-id')
    
    # Second call - cache hit
    result2 = await get_tracks('hospital-id')
    
    assert result1 == result2
    
    # Verify cache was used
    info = redis_client.info()
    assert info['keyspace_hits'] > 0
```

### Test Cache Invalidation

```python
@pytest.mark.asyncio
async def test_cache_invalidation():
    # Get data (cache miss)
    result1 = await get_tracks('hospital-id')
    
    # Update data
    await update_track('track-id', {'name': 'New Name'})
    
    # Get data again (cache miss due to invalidation)
    result2 = await get_tracks('hospital-id')
    
    assert result1 != result2
```

## Deployment

### Environment Variables

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_MAX_CONNECTIONS=50
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

## Monitoring

### Cache Metrics Dashboard

```python
# backend/api/routes/monitoring.py

@router.get("/monitoring/cache/metrics")
async def get_cache_metrics():
    info = redis_client.info()
    
    return {
        'memory': {
            'used': info['used_memory_human'],
            'peak': info['used_memory_peak_human'],
            'fragmentation_ratio': info['mem_fragmentation_ratio'],
        },
        'stats': {
            'total_commands': info['total_commands_processed'],
            'hits': info['keyspace_hits'],
            'misses': info['keyspace_misses'],
            'hit_rate': round(info['keyspace_hits'] / (info['keyspace_hits'] + info['keyspace_misses']) * 100, 2),
        },
        'clients': {
            'connected': info['connected_clients'],
            'blocked': info['blocked_clients'],
        },
        'keys': {
            'total': redis_client.dbsize(),
            'expires': info.get('expires', 0),
        }
    }
```

## References

- [Redis Documentation](https://redis.io/documentation)
- [SWR Documentation](https://swr.vercel.app/)
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/)
- [CloudFlare Cache](https://developers.cloudflare.com/cache/)

## Support

For caching issues:
1. Check Redis connection
2. Monitor cache hit rates
3. Review cache invalidation logic
4. Check memory usage
5. Verify TTL values
6. Test cache warming
