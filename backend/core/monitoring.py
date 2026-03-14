"""
Monitoring and error tracking configuration.
Integrates Sentry for error tracking and performance monitoring.
"""

import os
import logging
from typing import Optional
from functools import wraps
import time

logger = logging.getLogger(__name__)

# Sentry configuration
SENTRY_DSN = os.getenv("SENTRY_DSN")
SENTRY_ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SENTRY_TRACES_SAMPLE_RATE = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))

def init_sentry():
    """Initialize Sentry for error tracking and performance monitoring."""
    if not SENTRY_DSN:
        logger.warning("SENTRY_DSN not configured. Error tracking disabled.")
        return
    
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=SENTRY_ENVIRONMENT,
            traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions
            profiles_sample_rate=1.0,
            # Capture 100% of errors
            sample_rate=1.0,
            # Send default PII (Personally Identifiable Information)
            send_default_pii=False,
            # Attach stack traces to messages
            attach_stacktrace=True,
            # Maximum breadcrumbs
            max_breadcrumbs=50,
        )
        
        logger.info(f"Sentry initialized for environment: {SENTRY_ENVIRONMENT}")
    except ImportError:
        logger.warning("sentry-sdk not installed. Install with: pip install sentry-sdk")
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def capture_exception(error: Exception, context: Optional[dict] = None):
    """
    Capture an exception and send to Sentry.
    
    Args:
        error: The exception to capture
        context: Additional context to attach to the error
    """
    try:
        import sentry_sdk
        
        if context:
            with sentry_sdk.push_scope() as scope:
                for key, value in context.items():
                    scope.set_context(key, value)
                sentry_sdk.capture_exception(error)
        else:
            sentry_sdk.capture_exception(error)
    except ImportError:
        logger.error(f"Exception occurred but Sentry not available: {error}", exc_info=True)
    except Exception as e:
        logger.error(f"Failed to capture exception in Sentry: {e}", exc_info=True)


def capture_message(message: str, level: str = "info", context: Optional[dict] = None):
    """
    Capture a message and send to Sentry.
    
    Args:
        message: The message to capture
        level: Severity level (debug, info, warning, error, fatal)
        context: Additional context to attach to the message
    """
    try:
        import sentry_sdk
        
        if context:
            with sentry_sdk.push_scope() as scope:
                for key, value in context.items():
                    scope.set_context(key, value)
                sentry_sdk.capture_message(message, level=level)
        else:
            sentry_sdk.capture_message(message, level=level)
    except ImportError:
        logger.log(getattr(logging, level.upper(), logging.INFO), message)
    except Exception as e:
        logger.error(f"Failed to capture message in Sentry: {e}")


def set_user_context(user_id: str, email: Optional[str] = None, hospital_id: Optional[str] = None):
    """
    Set user context for error tracking.
    
    Args:
        user_id: User ID
        email: User email (optional, will be hashed)
        hospital_id: Hospital ID for multi-tenant context
    """
    try:
        import sentry_sdk
        
        user_data = {"id": user_id}
        if email:
            # Hash email for privacy
            import hashlib
            user_data["email_hash"] = hashlib.sha256(email.encode()).hexdigest()[:16]
        if hospital_id:
            user_data["hospital_id"] = hospital_id
        
        sentry_sdk.set_user(user_data)
    except ImportError:
        pass
    except Exception as e:
        logger.error(f"Failed to set user context: {e}")


def add_breadcrumb(message: str, category: str = "default", level: str = "info", data: Optional[dict] = None):
    """
    Add a breadcrumb for debugging context.
    
    Args:
        message: Breadcrumb message
        category: Category (e.g., "auth", "query", "http")
        level: Severity level
        data: Additional data
    """
    try:
        import sentry_sdk
        
        sentry_sdk.add_breadcrumb(
            message=message,
            category=category,
            level=level,
            data=data or {}
        )
    except ImportError:
        pass
    except Exception as e:
        logger.error(f"Failed to add breadcrumb: {e}")


def monitor_performance(operation_name: str):
    """
    Decorator to monitor function performance.
    
    Usage:
        @monitor_performance("database_query")
        def my_function():
            pass
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                import sentry_sdk
                with sentry_sdk.start_span(op=operation_name, description=func.__name__):
                    result = await func(*args, **kwargs)
            except ImportError:
                result = await func(*args, **kwargs)
            
            duration = time.time() - start_time
            
            # Log slow operations (> 1 second)
            if duration > 1.0:
                logger.warning(f"Slow operation: {operation_name}.{func.__name__} took {duration:.2f}s")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                import sentry_sdk
                with sentry_sdk.start_span(op=operation_name, description=func.__name__):
                    result = func(*args, **kwargs)
            except ImportError:
                result = func(*args, **kwargs)
            
            duration = time.time() - start_time
            
            # Log slow operations (> 1 second)
            if duration > 1.0:
                logger.warning(f"Slow operation: {operation_name}.{func.__name__} took {duration:.2f}s")
            
            return result
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


class PerformanceMonitor:
    """Context manager for monitoring performance of code blocks."""
    
    def __init__(self, operation_name: str, description: Optional[str] = None):
        self.operation_name = operation_name
        self.description = description or operation_name
        self.start_time = None
        self.span = None
    
    def __enter__(self):
        self.start_time = time.time()
        
        try:
            import sentry_sdk
            self.span = sentry_sdk.start_span(op=self.operation_name, description=self.description)
            self.span.__enter__()
        except ImportError:
            pass
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        
        if self.span:
            self.span.__exit__(exc_type, exc_val, exc_tb)
        
        # Log slow operations
        if duration > 1.0:
            logger.warning(f"Slow operation: {self.operation_name} took {duration:.2f}s")
        
        # Log errors
        if exc_type:
            logger.error(f"Error in {self.operation_name}: {exc_val}", exc_info=True)
        
        return False  # Don't suppress exceptions


# Metrics tracking
class MetricsCollector:
    """Simple metrics collector for tracking application metrics."""
    
    def __init__(self):
        self.metrics = {}
    
    def increment(self, metric_name: str, value: int = 1, tags: Optional[dict] = None):
        """Increment a counter metric."""
        key = self._make_key(metric_name, tags)
        self.metrics[key] = self.metrics.get(key, 0) + value
        
        # Log high-frequency events
        if self.metrics[key] % 100 == 0:
            logger.info(f"Metric {metric_name}: {self.metrics[key]}")
    
    def gauge(self, metric_name: str, value: float, tags: Optional[dict] = None):
        """Set a gauge metric."""
        key = self._make_key(metric_name, tags)
        self.metrics[key] = value
    
    def timing(self, metric_name: str, duration_ms: float, tags: Optional[dict] = None):
        """Record a timing metric."""
        key = self._make_key(metric_name, tags)
        if key not in self.metrics:
            self.metrics[key] = []
        self.metrics[key].append(duration_ms)
        
        # Log slow timings
        if duration_ms > 1000:  # > 1 second
            logger.warning(f"Slow timing for {metric_name}: {duration_ms:.2f}ms")
    
    def _make_key(self, metric_name: str, tags: Optional[dict] = None) -> str:
        """Create a unique key for the metric."""
        if not tags:
            return metric_name
        
        tag_str = ",".join(f"{k}={v}" for k, v in sorted(tags.items()))
        return f"{metric_name}[{tag_str}]"
    
    def get_metrics(self) -> dict:
        """Get all collected metrics."""
        return self.metrics.copy()
    
    def reset(self):
        """Reset all metrics."""
        self.metrics.clear()


# Global metrics collector instance
metrics = MetricsCollector()
