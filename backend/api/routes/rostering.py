"""
SL Academy Platform - AI Rostering Routes (Phase 3)
Conversational shift management with function calling + human approval flow.

Endpoints:
  POST /api/rostering/chat              — send message to the AI rostering assistant
  GET  /api/rostering/swaps             — list swap requests (doctor: own; manager: all)
  PATCH /api/rostering/swaps/{id}/approve — manager approves a swap (executes the slot transfer)
  PATCH /api/rostering/swaps/{id}/reject  — manager rejects a swap
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from utils.session import get_current_user
from middleware.auth import require_role
from core.database import get_db
from services.ai_rostering import ai_rostering_service
from utils.rate_limiter import rate_limiter
from supabase import Client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rostering", tags=["rostering"])


# ── Pydantic models ────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(
        ...,
        min_length=1,
        description="Conversation history. Last message must be role='user'.",
    )


class ChatResponse(BaseModel):
    reply: str
    tool_calls_made: List[str]
    swap_created: bool


class SwapRequestResponse(BaseModel):
    id: UUID
    hospital_id: UUID
    requester_id: UUID
    target_id: UUID
    slot_id: UUID
    reason: Optional[str]
    status: str
    reviewed_by: Optional[UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def rostering_chat(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Conversational shift management powered by AI function calling.

    The AI can:
    - Look up the doctor's schedule
    - Find available doctors for a given date/shift
    - Create shift swap requests (pending manager approval)
    - List the doctor's existing swap requests

    Rate limited to 20 messages per hour per user.
    Returns safe fallback if OPENAI_API_KEY is not configured.
    """
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        identifier=f"rostering:{current_user['user_id']}",
        max_requests=20,
        window_seconds=3600,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Limite de mensagens atingido. Tente novamente mais tarde.",
            headers={"Retry-After": str(retry_after)},
        )

    result = await ai_rostering_service.chat(
        messages=[m.model_dump() for m in body.messages],
        hospital_id=current_user["hospital_id"],
        requester_id=current_user["user_id"],
    )
    return ChatResponse(**result)


@router.get("/swaps", response_model=List[SwapRequestResponse])
async def list_swap_requests(
    swap_status: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    List shift swap requests.
    - Doctors see only their own requests (requester or target).
    - Managers see all requests for the hospital.
    """
    query = db.table("shift_swap_requests").select("*").eq(
        "hospital_id", current_user["hospital_id"]
    )

    if current_user["role"] == "doctor":
        # RLS already filters, but be explicit for clarity
        query = query.or_(
            f"requester_id.eq.{current_user['user_id']},"
            f"target_id.eq.{current_user['user_id']}"
        )

    if swap_status and swap_status != "all":
        query = query.eq("status", swap_status)

    resp = query.order("created_at", desc=True).execute()
    return resp.data or []


@router.patch("/swaps/{swap_id}/approve")
async def approve_swap(
    swap_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db),
):
    """
    Approve a swap request and execute the slot transfer (manager only).

    Execution:
    1. Marks the request as approved
    2. Updates schedule_slots.doctor_id to the target doctor
    """
    swap_resp = db.table("shift_swap_requests").select(
        "id, status, slot_id, target_id, hospital_id"
    ).eq("id", str(swap_id)).single().execute()

    if not swap_resp.data:
        raise HTTPException(status_code=404, detail="Swap request not found")

    swap = swap_resp.data
    if swap["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if swap["status"] != "pending":
        raise HTTPException(
            status_code=409,
            detail=f"Swap request is already '{swap['status']}'.",
        )

    # Execute the slot transfer
    db.table("schedule_slots").update({
        "doctor_id": swap["target_id"]
    }).eq("id", swap["slot_id"]).execute()

    # Mark as approved
    db.table("shift_swap_requests").update({
        "status":      "approved",
        "reviewed_by": current_user["user_id"],
        "reviewed_at": datetime.utcnow().isoformat(),
    }).eq("id", str(swap_id)).execute()

    logger.info(
        f"Swap {swap_id} approved by manager {current_user['user_id']} — "
        f"slot {swap['slot_id']} transferred to doctor {swap['target_id']}"
    )
    return {"swap_id": str(swap_id), "status": "approved"}


@router.patch("/swaps/{swap_id}/reject")
async def reject_swap(
    swap_id: UUID,
    current_user: dict = Depends(require_role("manager")),
    db: Client = Depends(get_db),
):
    """
    Reject a swap request (manager only). Slot remains unchanged.
    """
    swap_resp = db.table("shift_swap_requests").select(
        "id, status, hospital_id"
    ).eq("id", str(swap_id)).single().execute()

    if not swap_resp.data:
        raise HTTPException(status_code=404, detail="Swap request not found")

    swap = swap_resp.data
    if swap["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if swap["status"] != "pending":
        raise HTTPException(
            status_code=409,
            detail=f"Swap request is already '{swap['status']}'.",
        )

    db.table("shift_swap_requests").update({
        "status":      "rejected",
        "reviewed_by": current_user["user_id"],
        "reviewed_at": datetime.utcnow().isoformat(),
    }).eq("id", str(swap_id)).execute()

    logger.info(f"Swap {swap_id} rejected by manager {current_user['user_id']}")
    return {"swap_id": str(swap_id), "status": "rejected"}
