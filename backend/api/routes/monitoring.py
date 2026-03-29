"""
Monitoring and health check endpoints.
"""

import os
import time
import psutil
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

from core.monitoring import metrics
from core.database import Database
from middleware.auth import require_role

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: float
    version: str
    environment: str
    checks: Dict[str, bool]


class MetricsResponse(BaseModel):
    """Metrics response."""
    metrics: Dict[str, any]
    timestamp: float


class SystemMetricsResponse(BaseModel):
    """System metrics response."""
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Returns the health status of the application and its dependencies.
    """
    checks = {}
    
    # Check database connection
    try:
        supabase = Database.get_client()
        # Simple query to test connection
        result = supabase.table("hospitals").select("id").limit(1).execute()
        checks["database"] = True
    except Exception as e:
        checks["database"] = False
    
    # Check Sentry (if configured)
    checks["sentry"] = bool(os.getenv("SENTRY_DSN"))
    
    # Overall status
    status = "healthy" if all(checks.values()) else "degraded"
    
    return HealthResponse(
        status=status,
        timestamp=time.time(),
        version=os.getenv("APP_VERSION", "1.0.0"),
        environment=os.getenv("ENVIRONMENT", "development"),
        checks=checks,
    )


@router.get("/metrics", response_model=MetricsResponse, dependencies=[Depends(require_role("manager"))])
async def get_metrics():
    """
    Get application metrics.
    Requires manager role.
    """
    return MetricsResponse(
        metrics=metrics.get_metrics(),
        timestamp=time.time(),
    )


@router.get("/system", response_model=SystemMetricsResponse, dependencies=[Depends(require_role("manager"))])
async def get_system_metrics():
    """
    Get system resource metrics.
    Requires manager role.
    """
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=1)
    
    # Memory usage
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    memory_used_mb = memory.used / (1024 * 1024)
    memory_total_mb = memory.total / (1024 * 1024)
    
    # Disk usage
    disk = psutil.disk_usage('/')
    disk_percent = disk.percent
    disk_used_gb = disk.used / (1024 * 1024 * 1024)
    disk_total_gb = disk.total / (1024 * 1024 * 1024)
    
    return SystemMetricsResponse(
        cpu_percent=cpu_percent,
        memory_percent=memory_percent,
        memory_used_mb=memory_used_mb,
        memory_total_mb=memory_total_mb,
        disk_percent=disk_percent,
        disk_used_gb=disk_used_gb,
        disk_total_gb=disk_total_gb,
    )


@router.post("/reset-metrics", dependencies=[Depends(require_role("manager"))])
async def reset_metrics():
    """
    Reset all metrics.
    Requires manager role.
    """
    metrics.reset()
    return {"message": "Metrics reset successfully"}


@router.get("/readiness")
async def readiness_check():
    """
    Readiness check for Kubernetes/container orchestration.
    Returns 200 if the application is ready to serve traffic.
    """
    try:
        # Check database connection
        supabase = Database.get_client()
        supabase.table("hospitals").select("id").limit(1).execute()
        
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/liveness")
async def liveness_check():
    """
    Liveness check for Kubernetes/container orchestration.
    Returns 200 if the application is alive.
    """
    return {"status": "alive"}
