"""
SL Academy Platform — Burnout Risk Analyzer

Monitors doctor workload and generates burnout alerts based on
schedule data and shift swap history.  READ-ONLY on schedule tables:
this service **never** modifies schedule_slots or schedules.

Risk triggers (any one is sufficient):
  1. >60 hours scheduled in the last 7 days
  2. >3 night shifts in the last 7 days
  3. >2 swap requests *initiated* in the last 15 days

Risk level mapping:
  - 1 trigger  → medium
  - 2 triggers → high
  - 3 triggers → critical
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from core.database import Database

logger = logging.getLogger(__name__)

# ── Thresholds (easily tunable) ───────────────────────────────────────────────
_MAX_HOURS_7D = 60
_MAX_NIGHTS_7D = 3
_MAX_SWAPS_15D = 2

# Shift duration assumptions (hours)
_SHIFT_HOURS = 8


class BurnoutAnalyzer:
    """
    Analyses schedule data and swap history to assess burnout risk.

    GOLDEN RULE: This service is a **monitor only**.  It reads from
    schedule_slots, shift_swap_requests and writes only to burnout_alerts.
    It never modifies schedule_slots, schedules, or any roster data.
    """

    async def analyze_doctor_burnout_risk(
        self,
        hospital_id: str,
        doctor_id: str,
    ) -> dict:
        """
        Analyse burnout risk for a single doctor.

        Returns:
            {
                "doctor_id": str,
                "risk_level": "low" | "medium" | "high" | "critical",
                "triggers": [str],
                "alert_created": bool,
            }
        """
        db = Database.get_client()
        today = date.today()
        seven_days_ago = (today - timedelta(days=7)).isoformat()
        fifteen_days_ago = (today - timedelta(days=15)).isoformat()

        triggers: list[str] = []

        # ── Trigger 1: >60h scheduled in 7 days ──────────────────────────────
        slots_resp = (
            db.table("schedule_slots")
            .select("id, shift", count="exact")
            .eq("doctor_id", doctor_id)
            .gte("slot_date", seven_days_ago)
            .lte("slot_date", today.isoformat())
            .execute()
        )
        total_slots = len(slots_resp.data or [])
        total_hours = total_slots * _SHIFT_HOURS

        if total_hours > _MAX_HOURS_7D:
            triggers.append(
                f"Carga horária excessiva: {total_hours}h nos últimos 7 dias "
                f"(limite: {_MAX_HOURS_7D}h)"
            )

        # ── Trigger 2: >3 night shifts in 7 days ─────────────────────────────
        night_slots = [
            s for s in (slots_resp.data or []) if s.get("shift") == "night"
        ]
        if len(night_slots) > _MAX_NIGHTS_7D:
            triggers.append(
                f"Excesso de turnos noturnos: {len(night_slots)} nos últimos 7 dias "
                f"(limite: {_MAX_NIGHTS_7D})"
            )

        # ── Trigger 3: >2 swap requests initiated in 15 days ─────────────────
        swaps_resp = (
            db.table("shift_swap_requests")
            .select("id", count="exact")
            .eq("requester_id", doctor_id)
            .gte("created_at", fifteen_days_ago)
            .execute()
        )
        swap_count = len(swaps_resp.data or [])
        if swap_count > _MAX_SWAPS_15D:
            triggers.append(
                f"Pedidos de troca frequentes: {swap_count} nos últimos 15 dias "
                f"(limite: {_MAX_SWAPS_15D})"
            )

        # ── Risk level ────────────────────────────────────────────────────────
        n_triggers = len(triggers)
        if n_triggers == 0:
            risk_level = "low"
        elif n_triggers == 1:
            risk_level = "medium"
        elif n_triggers == 2:
            risk_level = "high"
        else:
            risk_level = "critical"

        # ── Persist alert (only if risk > low) ────────────────────────────────
        alert_created = False
        if risk_level != "low":
            try:
                db.table("burnout_alerts").insert({
                    "hospital_id": hospital_id,
                    "doctor_id": doctor_id,
                    "risk_level": risk_level,
                    "triggers": triggers,
                }).execute()
                alert_created = True
                logger.info(
                    "Burnout alert created",
                    extra={
                        "hospital_id": hospital_id,
                        "doctor_id": doctor_id,
                        "risk_level": risk_level,
                        "n_triggers": n_triggers,
                    },
                )
            except Exception as exc:
                logger.error(f"Burnout alert insert failed: {exc}")

        return {
            "doctor_id": doctor_id,
            "risk_level": risk_level,
            "triggers": triggers,
            "alert_created": alert_created,
        }

    async def analyze_hospital(self, hospital_id: str) -> list[dict]:
        """
        Analyse burnout risk for ALL doctors in a hospital.

        Returns a list of per-doctor results.
        """
        db = Database.get_client()
        doctors_resp = (
            db.table("profiles")
            .select("id")
            .eq("hospital_id", hospital_id)
            .eq("role", "doctor")
            .execute()
        )
        doctors = doctors_resp.data or []
        results = []
        for doc in doctors:
            result = await self.analyze_doctor_burnout_risk(
                hospital_id=hospital_id,
                doctor_id=doc["id"],
            )
            results.append(result)

        logger.info(
            "Hospital burnout scan complete",
            extra={
                "hospital_id": hospital_id,
                "doctors_scanned": len(results),
                "alerts_created": sum(1 for r in results if r["alert_created"]),
            },
        )
        return results


# ── Module-level singleton ─────────────────────────────────────────────────────
burnout_analyzer = BurnoutAnalyzer()
