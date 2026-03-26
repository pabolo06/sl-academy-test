"""
SL Academy Platform - Redis Caching Layer
Provides caching decorators and utilities for performance optimization
"""

import redis
import json
import hashlib
from typing import Optional, Any, Callable
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def _connect_redis():
    """Tenta conectar ao Redis; retorna None silenciosamente se não disponível."""
    try:
        from core.config import settings
        if not settings.redis_url:
            return None
        client = redis.from_url(settings.redis_url, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        logger.info("Redis conectado com sucesso.")
        return client
    except Exception as e:
        logger.warning(f"Redis indisponível, cache desabilitado: {e}")
        return None


redis_client = _connect_redis()


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments."""
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(ttl: int = 300, prefix: str = ''):
    """
    Cache decorator for async functions.
    
    Args:
        ttl: Time to live in seconds
        prefix: Cache key prefix for namespacing
    
    Example:
        @cached(ttl=600, prefix="tracks")
        async def get_tracks(hospital_id: str):
            return fetch_tracks_from_db(hospital_id)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if redis_client is None:
                return await func(*args, **kwargs)
            
            try:
                # Generate cache key
                key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
                
                # Try to get from cache
                cached_value = redis_client.get(key)
                if cached_value:
                    logger.debug(f"Cache hit: {key}")
                    return json.loads(cached_value)
                
                # Cache miss - execute function
                logger.debug(f"Cache miss: {key}")
                result = await func(*args, **kwargs)
                
                # Store in cache
                redis_client.setex(
                    key,
                    ttl,
                    json.dumps(result, default=str)
                )
                
                return result
            
            except Exception as e:
                logger.error(f"Cache error: {str(e)}")
                # Fallback to executing function without cache
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache keys matching pattern.
    
    Args:
        pattern: Redis key pattern (supports wildcards *)
    
    Example:
        invalidate_cache("tracks:*hospital-123*")
    """
    if redis_client is None:
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys matching pattern: {pattern}")
    except Exception as e:
        logger.error(f"Cache invalidation error: {str(e)}")


def get_cache_stats() -> dict:
    """
    Get Redis cache statistics.
    
    Returns:
        Dictionary with cache metrics
    """
    if redis_client is None:
        return {
            "status": "disabled",
            "message": "Redis is not available"
        }
    
    try:
        info = redis_client.info()
        
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        hit_rate = (hits / total * 100) if total > 0 else 0
        
        return {
            "status": "active",
            "memory": {
                "used": info.get('used_memory_human', 'N/A'),
                "peak": info.get('used_memory_peak_human', 'N/A'),
                "fragmentation_ratio": info.get('mem_fragmentation_ratio', 0),
            },
            "stats": {
                "total_commands": info.get('total_commands_processed', 0),
                "hits": hits,
                "misses": misses,
                "hit_rate": round(hit_rate, 2),
            },
            "clients": {
                "connected": info.get('connected_clients', 0),
                "blocked": info.get('blocked_clients', 0),
            },
            "keys": {
                "total": redis_client.dbsize(),
            }
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
