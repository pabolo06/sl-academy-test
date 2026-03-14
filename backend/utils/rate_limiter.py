"""
SL Academy Platform - Rate Limiting
Simple in-memory rate limiter for API endpoints
"""

from fastapi import HTTPException, Request, status
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """In-memory rate limiter with sliding window"""
    
    def __init__(self):
        # Store: {identifier: [(timestamp, count)]}
        self._requests: Dict[str, list] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def check_rate_limit(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Check if request is within rate limit
        Returns: (is_allowed, retry_after_seconds)
        """
        async with self._lock:
            now = datetime.utcnow()
            window_start = now - timedelta(seconds=window_seconds)
            
            # Clean old requests
            self._requests[identifier] = [
                req_time for req_time in self._requests[identifier]
                if req_time > window_start
            ]
            
            # Check limit
            current_count = len(self._requests[identifier])
            
            if current_count >= max_requests:
                # Calculate retry after
                oldest_request = min(self._requests[identifier])
                retry_after = int((oldest_request + timedelta(seconds=window_seconds) - now).total_seconds())
                return False, max(retry_after, 1)
            
            # Add current request
            self._requests[identifier].append(now)
            return True, 0
    
    async def cleanup_old_entries(self, max_age_hours: int = 24):
        """Cleanup old entries to prevent memory leak"""
        async with self._lock:
            cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
            
            for identifier in list(self._requests.keys()):
                self._requests[identifier] = [
                    req_time for req_time in self._requests[identifier]
                    if req_time > cutoff
                ]
                
                if not self._requests[identifier]:
                    del self._requests[identifier]


# Global rate limiter instance
rate_limiter = RateLimiter()


async def check_login_rate_limit(request: Request):
    """Rate limit dependency for login endpoint"""
    # Use IP address as identifier
    client_ip = request.client.host
    identifier = f"login:{client_ip}"
    
    # 5 attempts per 15 minutes
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=identifier,
        max_requests=5,
        window_seconds=15 * 60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)}
        )


async def check_test_submission_rate_limit(request: Request):
    """Rate limit dependency for test submission endpoint"""
    from utils.session import session_manager
    
    # Use user ID as identifier
    session = session_manager.get_session(request)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    identifier = f"test_submission:{session['user_id']}"
    
    # 20 submissions per hour
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=identifier,
        max_requests=20,
        window_seconds=60 * 60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many test submissions. Please try again later.",
            headers={"Retry-After": str(retry_after)}
        )


async def check_doubt_submission_rate_limit(request: Request):
    """Rate limit dependency for doubt submission endpoint"""
    from utils.session import session_manager
    
    # Use user ID as identifier
    session = session_manager.get_session(request)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    identifier = f"doubt_submission:{session['user_id']}"
    
    # 10 submissions per hour
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=identifier,
        max_requests=10,
        window_seconds=60 * 60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many doubt submissions. Please try again later.",
            headers={"Retry-After": str(retry_after)}
        )


async def check_indicator_import_rate_limit(request: Request):
    """Rate limit dependency for indicator import endpoint"""
    from utils.session import session_manager
    
    # Use user ID as identifier
    session = session_manager.get_session(request)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    identifier = f"indicator_import:{session['user_id']}"
    
    # 1 import per minute
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=identifier,
        max_requests=1,
        window_seconds=60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many indicator imports. Please try again later.",
            headers={"Retry-After": str(retry_after)}
        )


async def check_ai_request_rate_limit(request: Request):
    """Rate limit dependency for AI requests"""
    from utils.session import session_manager
    
    # Use user ID as identifier
    session = session_manager.get_session(request)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    identifier = f"ai_request:{session['user_id']}"
    
    # 5 requests per hour
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=identifier,
        max_requests=5,
        window_seconds=60 * 60
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many AI requests. Please try again later.",
            headers={"Retry-After": str(retry_after)}
        )
