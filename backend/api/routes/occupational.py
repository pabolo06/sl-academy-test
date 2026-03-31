"""
SL Academy Platform — Occupational Health Routes

Endpoints for managing burnout alerts and micro-learning tasks.
All endpoints enforce hospital_id isolation via session validation.
"""

from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from services.burnout_analyzer import burnout_analyzer
from services.micro_learning_service import micro_learning_service
from utils.session import get_current_user
from supabase import Client

router = APIRouter(prefix="/api/occupational", tags=["Occupational Health"])


# ── Burnout Alerts ─────────────────────────────────────────────────────────────

@router.get("/alerts")
async def list_burnout_alerts(
    acknowledged: bool = False,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    List burnout alerts for the current hospital.
    Query params:
      - acknowledged=false (default): active/unread alerts
      - acknowledged=true: already acknowledged alerts
    """
    hospital_id = current_user["hospital_id"]

    resp = (
        db.table("burnout_alerts")
        .select(
            "id, doctor_id, risk_level, triggers, is_acknowledged, created_at, "
            "profiles(email)"
        )
        .eq("hospital_id", hospital_id)
        .eq("is_acknowledged", acknowledged)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {
        "alerts": resp.data or [],
        "count": len(resp.data or []),
    }


@router.patch("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Mark a burnout alert as acknowledged (read) by the manager.
    Does NOT modify any schedule data — purely informational state change.
    """
    hospital_id = current_user["hospital_id"]
    role = current_user["role"]

    if role != "manager":
        raise HTTPException(status_code=403, detail="Apenas gestores podem reconhecer alertas.")

    alert_resp = (
        db.table("burnout_alerts")
        .select("id")
        .eq("id", alert_id)
        .eq("hospital_id", hospital_id)
        .single()
        .execute()
    )
    if not alert_resp.data:
        raise HTTPException(status_code=404, detail="Alerta não encontrado.")

    db.table("burnout_alerts").update(
        {"is_acknowledged": True}
    ).eq("id", alert_id).execute()

    return {"status": "acknowledged", "alert_id": alert_id}


# ── Burnout Scan ───────────────────────────────────────────────────────────────

@router.post("/scan/burnout")
async def run_burnout_scan(
    current_user: dict = Depends(get_current_user),
):
    """
    Trigger a hospital-wide burnout scan.
    Manager-only — analyses all doctors and creates alerts as needed.
    """
    hospital_id = current_user["hospital_id"]
    role = current_user["role"]

    if role != "manager":
        raise HTTPException(status_code=403, detail="Apenas gestores podem executar análises.")

    results = await burnout_analyzer.analyze_hospital(hospital_id)

    return {
        "status": "completed",
        "doctors_scanned": len(results),
        "alerts_created": sum(1 for r in results if r["alert_created"]),
        "results": results,
    }


# ── Micro-Learning ─────────────────────────────────────────────────────────────

@router.get("/micro-learning")
async def list_micro_learning_tasks(
    status: str = "pending",
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    List micro-learning recertification tasks for the current hospital.
    Query params:
      - status=pending (default), passed, failed
    """
    hospital_id = current_user["hospital_id"]

    resp = (
        db.table("micro_learning_tasks")
        .select(
            "id, doctor_id, track_id, status, due_date, created_at, "
            "profiles(email), tracks(title)"
        )
        .eq("hospital_id", hospital_id)
        .eq("status", status)
        .order("due_date", desc=False)
        .limit(50)
        .execute()
    )

    return {
        "tasks": resp.data or [],
        "count": len(resp.data or []),
    }


@router.post("/scan/micro-learning")
async def run_micro_learning_scan(
    current_user: dict = Depends(get_current_user),
):
    """
    Trigger micro-learning task generation for expired certifications.
    Manager-only.
    """
    hospital_id = current_user["hospital_id"]
    role = current_user["role"]

    if role != "manager":
        raise HTTPException(status_code=403, detail="Apenas gestores podem executar análises.")

    result = await micro_learning_service.generate_tasks(hospital_id)

    return {"status": "completed", **result}
