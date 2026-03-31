"""
SL Academy Platform - Schedule Routes
On-call doctor scheduling with Kanban board
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List
from uuid import UUID
from datetime import date, datetime, timedelta
from supabase import Client

from utils.session import get_current_user
from models.schedule import (
    ScheduleCreate,
    ScheduleResponse,
    ScheduleSlotCreate,
    ScheduleSlotResponse,
    SchedulePublish,
)
from core.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/schedule", tags=["schedule"])


# ── CREDENTIALING ENGINE ───────────────────────────────────────────────────────

def _validate_doctor_credentials(db: Client, doctor_id: str, track_id: str) -> None:
    """
    Validates that a doctor holds active certification for a given track.

    Certification = best POST-test score on EVERY non-deleted lesson in the track
                    must be >= the track's required_score.

    Raises HTTP 403 with a structured, human-readable error if the doctor
    does not meet the requirement.  Raises HTTP 404/422 on data anomalies.

    This implements the Frappe LMS "active credentialing" pattern:
    certification is tied to demonstrated test performance, not self-reporting.
    """
    # 1. Fetch track and its required_score
    track_resp = db.table("tracks").select("title, required_score").eq(
        "id", track_id
    ).is_("deleted_at", "null").single().execute()

    if not track_resp.data:
        raise HTTPException(status_code=404, detail="Required track not found")

    track_title: str = track_resp.data["title"]
    required_score = track_resp.data.get("required_score")

    # Track exists but has no score requirement — no credentialing needed
    if required_score is None:
        return

    # 2. Fetch all active lessons in the track
    lessons_resp = db.table("lessons").select("id, title").eq(
        "track_id", track_id
    ).is_("deleted_at", "null").execute()

    if not lessons_resp.data:
        raise HTTPException(
            status_code=422,
            detail=f"Track '{track_title}' has no active lessons. "
                   "Cannot validate credentialing.",
        )

    lesson_ids = [l["id"] for l in lessons_resp.data]
    lesson_titles = {l["id"]: l["title"] for l in lessons_resp.data}

    # 3. Fetch doctor's best POST-test score per lesson
    attempts_resp = db.table("test_attempts").select(
        "lesson_id, score"
    ).eq("profile_id", doctor_id).eq(
        "type", "post"
    ).in_("lesson_id", lesson_ids).execute()

    # Map lesson_id → best score achieved
    best_scores: dict[str, float] = {}
    for attempt in (attempts_resp.data or []):
        lid = attempt["lesson_id"]
        if lid not in best_scores or attempt["score"] > best_scores[lid]:
            best_scores[lid] = float(attempt["score"])

    # 4. Identify lessons where the doctor is not yet certified
    failed: list[str] = []
    for lid in lesson_ids:
        score = best_scores.get(lid)
        if score is None or score < float(required_score):
            status_str = f"{score:.1f}%" if score is not None else "not attempted"
            failed.append(f"  • {lesson_titles[lid]}: {status_str} (required: {required_score}%)")

    if failed:
        failed_list = "\n".join(failed)
        raise HTTPException(
            status_code=403,
            detail=(
                f"Credentialing failed: Doctor has not met the minimum certification "
                f"requirement of {required_score}% for track '{track_title}'.\n\n"
                f"Uncertified lessons ({len(failed)}/{len(lesson_ids)}):\n{failed_list}\n\n"
                "The doctor must complete the required post-tests before being "
                "scheduled for this sector."
            ),
        )

    logger.info(
        f"Credentialing passed: doctor {doctor_id} certified for track '{track_title}' "
        f"(required: {required_score}%, lessons: {len(lesson_ids)})"
    )


# ──────────────────────────────────────────────────────────────────────────────


def get_week_start(date_obj: date) -> date:
    """Get Monday of the week containing date_obj"""
    weekday = date_obj.weekday()  # Monday = 0
    return date_obj - timedelta(days=weekday)


@router.get("", response_model=ScheduleResponse)
async def get_schedule(
    week_start: str,  # YYYY-MM-DD
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Get schedule for a specific week

    - **week_start**: Start date of week (should be Monday)
    """
    try:
        week_date = datetime.strptime(week_start, "%Y-%m-%d").date()
        week_monday = get_week_start(week_date)

        # Fetch or create schedule
        response = db.table("schedules").select(
            "*, schedule_slots(id, doctor_id, slot_date, shift, notes, created_at)"
        ).eq("hospital_id", current_user["hospital_id"]).eq(
            "week_start", week_monday.isoformat()
        ).maybe_single().execute()

        if response.data:
            schedule = response.data
        else:
            # Create new schedule for this week
            insert_response = db.table("schedules").insert({
                "hospital_id": current_user["hospital_id"],
                "week_start": week_monday.isoformat(),
                "created_by": current_user["user_id"],
            }).select(
                "*, schedule_slots(id, doctor_id, slot_date, shift, notes, created_at)"
            ).single().execute()

            schedule = insert_response.data

        # Enrich slots with doctor emails
        if schedule.get("schedule_slots"):
            doctor_ids = [slot["doctor_id"] for slot in schedule["schedule_slots"]]
            doctors_response = db.table("profiles").select("id, email").in_(
                "id", doctor_ids
            ).execute()
            doctor_map = {doc["id"]: doc["email"] for doc in doctors_response.data}

            for slot in schedule["schedule_slots"]:
                slot["doctor_email"] = doctor_map.get(slot["doctor_id"], "")

        logger.info(
            f"Retrieved schedule for week {week_monday} in hospital {current_user['hospital_id']}"
        )
        return schedule

    except Exception as e:
        logger.error(f"Error retrieving schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve schedule",
        )


@router.post("/{schedule_id}/slots", response_model=ScheduleSlotResponse)
async def add_schedule_slot(
    schedule_id: UUID,
    slot: ScheduleSlotCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Add doctor to schedule slot (Kanban drag-and-drop)

    - **schedule_id**: Schedule UUID
    - **doctor_id**: Doctor to schedule
    - **slot_date**: Date of shift
    - **shift**: 'morning' | 'afternoon' | 'night'
    """
    # Verify user is manager
    if current_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can schedule doctors")

    # Verify schedule belongs to user's hospital and fetch credentialing config
    schedule_response = db.table("schedules").select(
        "hospital_id, required_track_id"
    ).eq("id", str(schedule_id)).single().execute()

    if not schedule_response.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if schedule_response.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # ── CREDENTIALING CHECK ────────────────────────────────────────────────────
    # If the schedule requires a track certification, validate the doctor's
    # post-test scores before allowing the assignment.
    # The requirement lives on the schedule (whole week), not on individual slots:
    # e.g. "ICU week of 2026-04-07 requires UTI Protocol track @ 80%."
    required_track_id = schedule_response.data.get("required_track_id")
    if required_track_id:
        _validate_doctor_credentials(
            db=db,
            doctor_id=str(slot.doctor_id),
            track_id=required_track_id,
        )
    # ──────────────────────────────────────────────────────────────────────────

    try:
        # Insert slot
        insert_response = db.table("schedule_slots").insert({
            "schedule_id": str(schedule_id),
            "doctor_id": str(slot.doctor_id),
            "slot_date": slot.slot_date.isoformat(),
            "shift": slot.shift,
            "notes": slot.notes,
        }).execute()

        if insert_response.data:
            slot_data = insert_response.data[0]

            # Get doctor email
            doctor_response = db.table("profiles").select("email").eq(
                "id", str(slot.doctor_id)
            ).single().execute()

            slot_data["doctor_email"] = doctor_response.data.get("email", "")

            logger.info(
                f"Added doctor {slot.doctor_id} to schedule {schedule_id} "
                f"for {slot.slot_date} ({slot.shift})"
            )
            return slot_data
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create slot",
            )

    except Exception as e:
        logger.error(f"Error adding schedule slot: {str(e)}")
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Doctor already scheduled for this shift",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add slot",
        )


@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_schedule_slot(
    slot_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Remove doctor from schedule slot

    - **slot_id**: Slot UUID to delete
    """
    # Verify user is manager
    if current_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can modify schedules")

    # Verify slot belongs to user's hospital
    slot_response = db.table("schedule_slots").select(
        "schedule_id"
    ).eq("id", str(slot_id)).single().execute()

    if not slot_response.data:
        raise HTTPException(status_code=404, detail="Slot not found")

    schedule_id = slot_response.data["schedule_id"]
    schedule_response = db.table("schedules").select("hospital_id").eq(
        "id", schedule_id
    ).single().execute()

    if schedule_response.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        db.table("schedule_slots").delete().eq("id", str(slot_id)).execute()
        logger.info(f"Removed slot {slot_id}")

    except Exception as e:
        logger.error(f"Error removing schedule slot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove slot",
        )


@router.patch("/{schedule_id}/publish", response_model=ScheduleResponse)
async def publish_schedule(
    schedule_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Publish schedule (change status to published)

    - **schedule_id**: Schedule UUID
    """
    # Verify user is manager
    if current_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can publish schedules")

    # Verify schedule belongs to user's hospital
    schedule_response = db.table("schedules").select("hospital_id").eq(
        "id", str(schedule_id)
    ).single().execute()

    if not schedule_response.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if schedule_response.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        update_response = db.table("schedules").update({
            "status": "published"
        }).eq("id", str(schedule_id)).select(
            "*, schedule_slots(id, doctor_id, slot_date, shift, notes, created_at)"
        ).single().execute()

        if update_response.data:
            schedule = update_response.data

            # Enrich slots with doctor emails
            if schedule.get("schedule_slots"):
                doctor_ids = [slot["doctor_id"] for slot in schedule["schedule_slots"]]
                doctors_response = db.table("profiles").select("id, email").in_(
                    "id", doctor_ids
                ).execute()
                doctor_map = {doc["id"]: doc["email"] for doc in doctors_response.data}

                for slot in schedule["schedule_slots"]:
                    slot["doctor_email"] = doctor_map.get(slot["doctor_id"], "")

            logger.info(f"Published schedule {schedule_id}")
            return schedule
        else:
            raise HTTPException(status_code=404, detail="Schedule not found")

    except Exception as e:
        logger.error(f"Error publishing schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish schedule",
        )


@router.patch("/{schedule_id}/required-track")
async def set_required_track(
    schedule_id: UUID,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Set (or clear) the track certification required for all slots in this schedule.

    - **required_track_id**: Track UUID, or null to remove the requirement.

    Once set, any doctor added to a slot in this schedule will be validated
    against that track's required_score via the Credentialing Engine.
    """
    if current_user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Only managers can configure credentialing")

    schedule_resp = db.table("schedules").select("hospital_id").eq(
        "id", str(schedule_id)
    ).single().execute()

    if not schedule_resp.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if schedule_resp.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    track_id = body.get("required_track_id")

    # Validate the track exists and belongs to this hospital (if provided)
    if track_id:
        track_resp = db.table("tracks").select("id, title").eq(
            "id", track_id
        ).eq("hospital_id", current_user["hospital_id"]).is_("deleted_at", "null").single().execute()

        if not track_resp.data:
            raise HTTPException(status_code=404, detail="Track not found in your hospital")

    try:
        db.table("schedules").update({
            "required_track_id": track_id,
        }).eq("id", str(schedule_id)).execute()

        action = f"set to track {track_id}" if track_id else "cleared"
        logger.info(f"Schedule {schedule_id} credentialing requirement {action}")
        return {"schedule_id": str(schedule_id), "required_track_id": track_id}

    except Exception as e:
        logger.error(f"Error setting required track: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update credentialing requirement",
        )


@router.get("/my-shifts", response_model=List[ScheduleSlotResponse])
async def get_my_shifts(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """
    Get shifts for current doctor this week
    """
    # Doctor only
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their shifts")

    try:
        # Get this week's Monday
        today = date.today()
        week_monday = get_week_start(today)

        # Get all slots for this doctor this week
        response = db.table("schedule_slots").select(
            "*, schedules(week_start)"
        ).eq("doctor_id", current_user["user_id"]).gte(
            "slot_date", week_monday.isoformat()
        ).lt(
            "slot_date", (week_monday + timedelta(days=7)).isoformat()
        ).eq("schedules.status", "published").order(
            "slot_date", desc=False
        ).execute()

        if response.data:
            # Enrich with doctor email (which is current user's email)
            for slot in response.data:
                slot["doctor_email"] = current_user["email"]

            logger.info(f"Retrieved {len(response.data)} shifts for doctor {current_user['user_id']}")
            return response.data
        else:
            return []

    except Exception as e:
        logger.error(f"Error retrieving doctor shifts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve shifts",
        )
