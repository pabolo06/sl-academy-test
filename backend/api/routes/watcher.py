"""
SL Academy Platform - Scrapling Watcher Routes (Phase 4)
Endpoints for triggering guideline checks and managing clinical alerts.

Endpoints:
  POST /api/watcher/check               — trigger a check for a track (manager only)
  GET  /api/watcher/alerts              — list clinical alerts (manager: all; doctor: read-only)
  PATCH /api/watcher/alerts/{id}/read   — mark alert as read (manager only)
  DELETE /api/watcher/alerts/{id}       — dismiss/delete alert (manager only)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from utils.session import get_current_user
from middleware.auth import require_role
from core.database import get_db
from services.scrapling_watcher import scrapling_watcher
from supabase import Client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/watcher", tags=["watcher"])


# ── Pydantic models ────────────────────────────────────────────────────────────

class CheckRequest(BaseModel):
    track_id: UUID = Field(..., description="Track to monitor for updates.")
    search_term: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Medical keyword(s) to search (e.g. 'sepse', 'antibiótico profilático').",
    )
    sources: Optional[List[str]] = Field(
        None,
        description="Sources to check. Defaults to all: ['pubmed', 'ministerio_saude'].",
    )


class CheckResponse(BaseModel):
    alerts_created: int
    alerts: list
    errors: list


class ClinicalAlertResponse(BaseModel):
    id: UUID
    hospital_id: UUID
    track_id: Optional[UUID]
    source: str
    title: str
    url: Optional[str]
    summary: Optional[str]
    severity: str
    is_read: bool
    created_at: datetime


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/check", response_model=CheckResponse)
async def trigger_check(
    body: CheckRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("manager")),
):
    """
    Trigger a Scrapling Watcher check for a track.
    Scrapes configured sources for the given search term and stores any
    new results as clinical alerts. Manager-only.

    Note: runs synchronously (not in background) so the manager gets
    immediate feedback on how many alerts were found.
    """
    result = await scrapling_watcher.check_track_updates(
        track_id=str(body.track_id),
        search_term=body.search_term,
        hospital_id=current_user["hospital_id"],
        sources=body.sources,
    )
    return CheckResponse(**result)


@router.get("/alerts", response_model=List[ClinicalAlertResponse])
async def list_alerts(
    track_id: Optional[UUID] = Query(None),
    source: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    List clinical alerts for the current hospital.
    Both doctors and managers can read alerts.
    Optional filters: track_id, source, severity, unread_only.
    """
    query = (
        db.table("clinical_alerts")
        .select("*")
        .eq("hospital_id", current_user["hospital_id"])
    )

    if track_id:
        query = query.eq("track_id", str(track_id))
    if source:
        query = query.eq("source", source)
    if severity:
        query = query.eq("severity", severity)
    if unread_only:
        query = query.eq("is_read", False)

    resp = query.order("created_at", desc=True).execute()
    return resp.data or []


@router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(
    alert_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db),
):
    """Mark a clinical alert as read (acknowledged). Manager only."""
    alert_resp = (
        db.table("clinical_alerts")
        .select("id, hospital_id")
        .eq("id", str(alert_id))
        .single()
        .execute()
    )

    if not alert_resp.data:
        raise HTTPException(status_code=404, detail="Alert not found")

    if alert_resp.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    db.table("clinical_alerts").update({"is_read": True}).eq(
        "id", str(alert_id)
    ).execute()

    return {"alert_id": str(alert_id), "is_read": True}


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db),
):
    """Dismiss (delete) a clinical alert. Manager only."""
    alert_resp = (
        db.table("clinical_alerts")
        .select("id, hospital_id")
        .eq("id", str(alert_id))
        .single()
        .execute()
    )

    if not alert_resp.data:
        raise HTTPException(status_code=404, detail="Alert not found")

    if alert_resp.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    db.table("clinical_alerts").delete().eq("id", str(alert_id)).execute()
    logger.info(f"Alert {alert_id} deleted by manager {current_user['user_id']}")
