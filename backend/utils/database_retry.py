"""
SL Academy Platform - Database Retry Logic
Implements exponential backoff for database operations
"""

import asyncio
import logging
from typing import Callable, TypeVar, Any
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


async def retry_with_backoff(
    func: Callable[..., T],
    max_retries: int = 3,
    initial_delay: float = 0.5,
    backoff_factor: float = 2.0,
    *args,
    **kwargs
) -> T:
    """
    Retry function with exponential backoff
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retries
        initial_delay: Initial delay in seconds
        backoff_factor: Multiplier for delay on each retry
        *args: Function arguments
        **kwargs: Function keyword arguments
    
    Returns:
        Function result
    
    Raises:
        Last exception if all retries fail
    """
    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
        
        except Exception as e:
            last_exception = e
            
            if attempt < max_retries:
                logger.warning(
                    f"Database operation failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}. "
                    f"Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(
                    f"Database operation failed after {max_retries + 1} attempts: {str(e)}"
                )
    
    raise last_exception


def with_retry(max_retries: int = 3):
    """
    Decorator to add retry logic to database functions
    
    Usage:
        @with_retry(max_retries=3)
        async def my_db_function():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_with_backoff(
                func,
                max_retries=max_retries,
                *args,
                **kwargs
            )
        return wrapper
    return decorator
