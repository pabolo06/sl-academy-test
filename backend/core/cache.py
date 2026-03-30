"""
SL Academy Platform - Redis Caching Layer
Provides caching decorators and utilities for performance optimization
"""

import redis.asyncio as redis
import json
import hashlib
from typing import Optional, Callable
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Lazy async client — initialized on first use inside an async context
_redis_client: Optional[redis.Redis] = None
_redis_disabled: bool = False  # set to True after a failed connection attempt


async def _get_redis() -> Optional[redis.Redis]:
    """
    Returns the async Redis client, connecting on first call.
    Returns None (and disables further attempts) if Redis is unavailable.
    """
    global _redis_client, _redis_disabled

    if _redis_disabled:
        return None

    if _redis_client is not None:
        return _redis_client

    try:
        from core.config import settings
        if not settings.redis_url:
            _redis_disabled = True
            return None

        client = redis.from_url(
            settings.redis_url,
            socket_connect_timeout=2,
            socket_timeout=2,
            decode_responses=True,
        )
        await client.ping()
        _redis_client = client
        logger.info("Redis conectado com sucesso.")
        return _redis_client

    except Exception as e:
        logger.warning(f"Redis indisponível, cache desabilitado: {e}")
        _redis_disabled = True  # persists across calls — read at the top of this function
        return None


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
            client = await _get_redis()
            if client is None:
                return await func(*args, **kwargs)

            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"

            try:
                cached_value = await client.get(key)
                if cached_value:
                    logger.debug(f"Cache hit: {key}")
                    return json.loads(cached_value)

                logger.debug(f"Cache miss: {key}")
                result = await func(*args, **kwargs)

                await client.setex(
                    key,
                    ttl,
                    json.dumps(result, default=str)
                )
                return result

            except Exception as e:
                logger.error(f"Cache error: {str(e)}")
                return await func(*args, **kwargs)

        return wrapper
    return decorator


async def invalidate_cache(pattern: str) -> None:
    """
    Invalidate cache keys matching pattern.

    Args:
        pattern: Redis key pattern (supports wildcards *)

    Example:
        await invalidate_cache("tracks:*hospital-123*")
    """
    client = await _get_redis()
    if client is None:
        return

    try:
        keys = await client.keys(pattern)
        if keys:
            await client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys matching pattern: {pattern}")
    except Exception as e:
        logger.error(f"Cache invalidation error: {str(e)}")


async def get_redis_client() -> Optional[redis.Redis]:
    """
    Get the Redis client instance for direct access (e.g., in tests).

    Returns:
        Redis client or None if unavailable
    """
    return await _get_redis()


# Alias for backwards compatibility with tests
redis_client = get_redis_client


async def get_cache_stats() -> dict:
    """
    Get Redis cache statistics.

    Returns:
        Dictionary with cache metrics
    """
    client = await _get_redis()
    if client is None:
        return {
            "status": "disabled",
            "message": "Redis is not available"
        }

    try:
        info = await client.info()

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
                "total": await client.dbsize(),
            }
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
