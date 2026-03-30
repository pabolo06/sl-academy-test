"""
SL Academy Platform - FHIR Integration Service

Sends FHIR-aligned PractitionerQualification payloads to hospital
webhook endpoints when a doctor passes a certification exam.

Graceful degradation:
  - If no integration is configured → logs and returns silently
  - If webhook fails → logs error, never raises (fire-and-forget)
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

import httpx

from core.config import settings
from core.database import Database

logger = logging.getLogger(__name__)


class FHIRIntegrationService:
    """Builds FHIR-simplified payloads and POSTs them to hospital webhooks."""

    # ── Public API ─────────────────────────────────────────────────────────────

    async def notify_qualification(
        self,
        hospital_id: str,
        doctor_id: str,
        doctor_email: str,
        track_id: str,
        track_title: str,
        score: float,
        passed_at: str | None = None,
    ) -> dict:
        """
        Build a FHIR PractitionerQualification resource and POST it to
        every active webhook configured for the hospital.

        Args:
            hospital_id:  UUID of the hospital
            doctor_id:    UUID of the doctor (profile_id)
            doctor_email: Email used as FHIR practitioner identifier
            track_id:     UUID of the track/certification
            track_title:  Human-readable track name (used as qualification code)
            score:        Numerical score (0-100)
            passed_at:    ISO timestamp when the exam was passed

        Returns:
            {"status": "sent" | "no_integrations" | "error", "webhooks": int}
        """
        db = Database.get_client()

        # 1. Fetch active integrations for this hospital
        integrations_resp = (
            db.table("hospital_integrations")
            .select("id, webhook_url, auth_token")
            .eq("hospital_id", hospital_id)
            .eq("is_active", True)
            .execute()
        )
        integrations = integrations_resp.data or []

        if not integrations:
            logger.info(
                "FHIR: no active integrations",
                extra={"hospital_id": hospital_id},
            )
            return {"status": "no_integrations", "webhooks": 0}

        # 2. Build FHIR-simplified payload (dict → validates before JSON)
        payload = self._build_practitioner_qualification(
            doctor_id=doctor_id,
            doctor_email=doctor_email,
            track_id=track_id,
            track_title=track_title,
            score=score,
            passed_at=passed_at,
        )

        # Sanity: payload must be a valid dict before sending
        assert isinstance(payload, dict), "FHIR payload must be a dict"

        # 3. POST to each webhook (fire-and-forget, non-blocking)
        sent = 0
        for integration in integrations:
            ok = await self._post_to_webhook(
                url=integration["webhook_url"],
                token=integration["auth_token"],
                payload=payload,
                hospital_id=hospital_id,
            )
            if ok:
                sent += 1

        return {"status": "sent" if sent > 0 else "error", "webhooks": sent}

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _build_practitioner_qualification(
        *,
        doctor_id: str,
        doctor_email: str,
        track_id: str,
        track_title: str,
        score: float,
        passed_at: str | None = None,
    ) -> dict:
        """
        Build a FHIR-simplified PractitionerQualification resource.

        Follows HL7 FHIR R4 structure with minimised fields for
        interoperability with EHR systems.
        """
        now_iso = passed_at or datetime.now(timezone.utc).isoformat()

        return {
            "resourceType": "Bundle",
            "type": "message",
            "timestamp": now_iso,
            "entry": [
                {
                    "resource": {
                        "resourceType": "Practitioner",
                        "id": doctor_id,
                        "identifier": [
                            {
                                "system": "urn:sl-academy:profile",
                                "value": doctor_id,
                            },
                            {
                                "system": "email",
                                "value": doctor_email,
                            },
                        ],
                        "qualification": [
                            {
                                "identifier": [
                                    {
                                        "system": "urn:sl-academy:track",
                                        "value": track_id,
                                    }
                                ],
                                "code": {
                                    "coding": [
                                        {
                                            "system": "urn:sl-academy:certification",
                                            "code": track_id,
                                            "display": track_title,
                                        }
                                    ],
                                    "text": track_title,
                                },
                                "period": {
                                    "start": now_iso,
                                },
                                "extension": [
                                    {
                                        "url": "urn:sl-academy:score",
                                        "valueDecimal": round(score, 2),
                                    }
                                ],
                            }
                        ],
                    }
                }
            ],
        }

    @staticmethod
    async def _post_to_webhook(
        url: str,
        token: str,
        payload: dict,
        hospital_id: str,
    ) -> bool:
        """POST the FHIR payload to a webhook URL with Bearer auth."""
        t0 = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/fhir+json",
                    },
                )

            elapsed = round((time.time() - t0) * 1000)

            if response.status_code < 300:
                logger.info(
                    "FHIR webhook delivered",
                    extra={
                        "hospital_id": hospital_id,
                        "url": url,
                        "status": response.status_code,
                        "elapsed_ms": elapsed,
                    },
                )
                return True
            else:
                logger.warning(
                    "FHIR webhook non-2xx response",
                    extra={
                        "hospital_id": hospital_id,
                        "url": url,
                        "status": response.status_code,
                        "elapsed_ms": elapsed,
                    },
                )
                return False

        except Exception as exc:
            logger.error(
                "FHIR webhook failed",
                extra={
                    "hospital_id": hospital_id,
                    "url": url,
                    "error": str(exc),
                },
            )
            return False


# ── Module-level singleton ─────────────────────────────────────────────────────
fhir_integration_service = FHIRIntegrationService()
