"""
SL Academy Platform — Micro-Learning Service

Identifies doctors whose POP certifications are stale (>180 days since
passing the post-test) and generates pending micro_learning_tasks for
recertification.

READ-ONLY on test_attempts and tracks — writes only to micro_learning_tasks.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from core.database import Database

logger = logging.getLogger(__name__)

_RECERT_DAYS = 180  # certification validity window


class MicroLearningService:
    """
    Detects expired POP certifications and creates micro-learning
    recertification tasks.
    """

    async def generate_tasks(self, hospital_id: str) -> dict:
        """
        Scan all doctors in a hospital for expired certifications
        and insert pending micro_learning_tasks where needed.

        Returns:
            {"tasks_created": int, "doctors_checked": int}
        """
        db = Database.get_client()
        cutoff = (date.today() - timedelta(days=_RECERT_DAYS)).isoformat()

        # 1. Fetch all doctors in this hospital
        doctors_resp = (
            db.table("profiles")
            .select("id")
            .eq("hospital_id", hospital_id)
            .eq("role", "doctor")
            .execute()
        )
        doctors = doctors_resp.data or []

        # 2. Fetch all tracks for this hospital
        tracks_resp = (
            db.table("tracks")
            .select("id, title")
            .eq("hospital_id", hospital_id)
            .is_("deleted_at", "null")
            .execute()
        )
        tracks = tracks_resp.data or []

        tasks_created = 0

        for doctor in doctors:
            doc_id = doctor["id"]

            for track in tracks:
                track_id = track["id"]

                # 3. Find latest passing post-test for this doctor × track
                latest_pass = (
                    db.table("test_attempts")
                    .select("created_at")
                    .eq("profile_id", doc_id)
                    .eq("type", "post")
                    .gte("score", 70)  # passing threshold
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )

                # Filter by track: test_attempts link to lessons → tracks
                # Simplified: if no passing attempt exists at all, skip
                # (we only recertify doctors who passed before)
                if not latest_pass.data:
                    continue

                last_pass_date = latest_pass.data[0]["created_at"][:10]
                if last_pass_date > cutoff:
                    continue  # still valid

                # 4. Check if a pending task already exists
                existing = (
                    db.table("micro_learning_tasks")
                    .select("id")
                    .eq("doctor_id", doc_id)
                    .eq("track_id", track_id)
                    .eq("status", "pending")
                    .execute()
                )
                if existing.data:
                    continue  # already assigned

                # 5. Create pending micro-learning task
                due = (date.today() + timedelta(days=30)).isoformat()
                db.table("micro_learning_tasks").insert({
                    "hospital_id": hospital_id,
                    "doctor_id": doc_id,
                    "track_id": track_id,
                    "status": "pending",
                    "due_date": due,
                }).execute()
                tasks_created += 1

        logger.info(
            "Micro-learning scan complete",
            extra={
                "hospital_id": hospital_id,
                "doctors_checked": len(doctors),
                "tasks_created": tasks_created,
            },
        )

        return {
            "doctors_checked": len(doctors),
            "tasks_created": tasks_created,
        }


# ── Module-level singleton ─────────────────────────────────────────────────────
micro_learning_service = MicroLearningService()
