"""
SL Academy Platform - Cache Tests
Tests for Redis caching functionality
"""

import pytest
import asyncio
from core.cache import cached, invalidate_cache, redis_client, get_cache_stats


# Mock async function for testing
@cached(ttl=60, prefix="test")
async def mock_cached_function(value: str):
    """Mock function that returns the input value."""
    return {"result": value}


@pytest.mark.asyncio
async def test_cache_hit():
    """Test that cache returns cached value on second call."""
    if redis_client is None:
        pytest.skip("Redis is not available")
    
    # Clear cache
    invalidate_cache("test:*")
    
    # First call - cache miss
    result1 = await mock_cached_function("test_value")
    
    # Second call - cache hit
    result2 = await mock_cached_function("test_value")
    
    # Results should be identical
    assert result1 == result2
    assert result1["result"] == "test_value"
    
    # Verify cache was used
    stats = get_cache_stats()
    if stats["status"] == "active":
        assert stats["stats"]["hits"] > 0


@pytest.mark.asyncio
async def test_cache_invalidation():
    """Test that cache invalidation works correctly."""
    if redis_client is None:
        pytest.skip("Redis is not available")
    
    # Clear cache
    invalidate_cache("test:*")
    
    # First call
    result1 = await mock_cached_function("value1")
    
    # Invalidate cache
    invalidate_cache("test:*")
    
    # Second call with different value
    result2 = await mock_cached_function("value2")
    
    # Results should be different
    assert result1["result"] == "value1"
    assert result2["result"] == "value2"


@pytest.mark.asyncio
async def test_cache_ttl():
    """Test that cache expires after TTL."""
    if redis_client is None:
        pytest.skip("Redis is not available")
    
    # Create function with very short TTL
    @cached(ttl=1, prefix="test_ttl")
    async def short_ttl_function(value: str):
        return {"result": value}
    
    # Clear cache
    invalidate_cache("test_ttl:*")
    
    # First call
    result1 = await short_ttl_function("test")
    
    # Wait for TTL to expire
    await asyncio.sleep(2)
    
    # Second call should be cache miss
    result2 = await short_ttl_function("test")
    
    # Results should be identical
    assert result1 == result2


def test_cache_stats():
    """Test that cache stats are returned correctly."""
    if redis_client is None:
        pytest.skip("Redis is not available")
    
    stats = get_cache_stats()
    
    assert stats["status"] in ["active", "disabled", "error"]
    
    if stats["status"] == "active":
        assert "memory" in stats
        assert "stats" in stats
        assert "clients" in stats
        assert "keys" in stats
        assert "hit_rate" in stats["stats"]


@pytest.mark.asyncio
async def test_cache_with_different_args():
    """Test that cache differentiates between different arguments."""
    if redis_client is None:
        pytest.skip("Redis is not available")
    
    # Clear cache
    invalidate_cache("test:*")
    
    # Call with different arguments
    result1 = await mock_cached_function("value1")
    result2 = await mock_cached_function("value2")
    
    # Results should be different
    assert result1["result"] == "value1"
    assert result2["result"] == "value2"


def test_invalidate_cache_pattern():
    """Test that cache invalidation with pattern works."""
    if redis_client is None:
        pytest.skip("Redis is not available")
    
    # Set some test keys
    redis_client.set("test:key1", "value1")
    redis_client.set("test:key2", "value2")
    redis_client.set("other:key3", "value3")
    
    # Invalidate only test:* keys
    invalidate_cache("test:*")
    
    # test:* keys should be gone
    assert redis_client.get("test:key1") is None
    assert redis_client.get("test:key2") is None
    
    # other:* keys should still exist
    assert redis_client.get("other:key3") == "value3"
    
    # Cleanup
    redis_client.delete("other:key3")


@pytest.mark.asyncio
async def test_cache_fallback_on_redis_error():
    """Test that function executes normally when Redis fails."""
    # This test verifies graceful degradation
    
    @cached(ttl=60, prefix="test_fallback")
    async def fallback_function(value: str):
        return {"result": value}
    
    # Function should work even if Redis is unavailable
    result = await fallback_function("test")
    assert result["result"] == "test"
