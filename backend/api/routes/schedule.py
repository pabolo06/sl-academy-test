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
        ).single().execute()

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

    # Verify schedule belongs to user's hospital
    schedule_response = db.table("schedules").select("hospital_id").eq(
        "id", str(schedule_id)
    ).single().execute()

    if not schedule_response.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if schedule_response.data["hospital_id"] != current_user["hospital_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

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
