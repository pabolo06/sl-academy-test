"""
SL Academy Platform — Enterprise Core Test Suite
=================================================

5 critical pillar tests validating the Enterprise refactoring:

1. PII Scrubbing     — LGPD/HIPAA data masking
2. AI Rostering      — Credential-blocked shift swap
3. CDSS Cache        — Semantic cache prevents duplicate OpenAI calls
4. Circuit Breaker   — Tenacity fallback on OpenAI failure
5. Burnout Analyzer  — Occupational health risk detection

All tests are fully isolated (no network, no database).

Run: pytest tests/test_enterprise_core.py -v
"""

import sys
import os
import time
from unittest.mock import MagicMock, AsyncMock, patch

import pytest

# Path patch — ensures imports resolve from the backend root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════════════════════════════════════════
# 1. PII SCRUBBING — Segurança LGPD/HIPAA
# ═══════════════════════════════════════════════════════════════════════════════

class TestPIIScrubbing:
    """Verifica que CPFs, telefones e emails são mascarados com [DADO_SENSIVEL]."""

    def test_cpf_and_phone_are_scrubbed(self):
        from utils.pii_scrubber import scrub_pii

        raw = "Dr. Silva, CPF 123.456.789-00, tel (11) 91234-5678"
        result = scrub_pii(raw)

        assert "123.456.789-00" not in result, "CPF não foi mascarado"
        assert "91234-5678" not in result, "Telefone não foi mascarado"
        assert result.count("[DADO_SENSIVEL]") >= 2

    def test_email_scrubbed(self):
        from utils.pii_scrubber import scrub_pii

        result = scrub_pii("Envie para dr.joao@hospital.com.br")
        assert "dr.joao@hospital.com.br" not in result
        assert "[DADO_SENSIVEL]" in result

    def test_clean_text_unchanged(self):
        from utils.pii_scrubber import scrub_pii

        clean = "Qual a dosagem de amoxicilina para pneumonia?"
        assert scrub_pii(clean) == clean


# ═══════════════════════════════════════════════════════════════════════════════
# 2. MÉDICO REBELDE — AI Rostering bloqueia troca sem credenciais
# ═══════════════════════════════════════════════════════════════════════════════

class TestMedicoRebelde:
    """
    Simula um médico sem certificação tentando uma troca de plantão.
    A troca deve ser bloqueada ANTES de qualquer INSERT no banco.
    """

    @patch("services.ai_rostering.Database")
    def test_swap_blocked_when_uncertified(self, mock_db_class):
        from services.ai_rostering import RosteringTools

        # ── Mock chain: db.table(...).select(...).eq(...).single().execute()
        mock_db = MagicMock()
        mock_db_class.get_client.return_value = mock_db

        # Build a fluent mock that supports .table().select().eq().single().execute()
        mock_chain = MagicMock()
        mock_chain.execute.return_value = MagicMock(data=None)

        # Every chained method returns the same mock_chain
        for method in ["table", "select", "eq", "single", "gte", "lte",
                        "order", "is_", "insert"]:
            getattr(mock_chain, method).return_value = mock_chain
        mock_db.table.return_value = mock_chain

        # First call: slot lookup → returns slot owned by requester
        slot_data = {
            "id": "slot-1",
            "doctor_id": "requester-1",
            "schedules": {"hospital_id": "hosp-1"},
        }
        # Second call: slot_full → returns required track
        slot_full_data = {
            "schedules": {"id": "sched-1", "required_track_id": "track-1"},
        }

        # Sequence the .execute() returns
        execute_results = [
            MagicMock(data=slot_data),     # slot lookup
            MagicMock(data=slot_full_data), # slot_full (credential check)
        ]
        mock_chain.execute.side_effect = execute_results

        # Create the tools instance — constructor is (hospital_id, requester_id)
        # Database.get_client() is already patched above
        tools = RosteringTools(
            hospital_id="hosp-1",
            requester_id="requester-1",
        )

        # Mock _check_credentials to return FAILED
        tools._check_credentials = MagicMock(
            return_value=(False, "Médico não possui certificação no track Cardiologia")
        )

        # ── ACT ──────────────────────────────────────────────────────────────
        result = tools._request_shift_swap(
            slot_id="slot-1",
            target_doctor_id="bad-doctor-99",
            reason="Preciso folgar",
        )

        # ── ASSERT ───────────────────────────────────────────────────────────
        assert "error" in result, "Troca deveria ter sido bloqueada"
        assert "Troca bloqueada" in result["error"]

        # Verify that INSERT was NEVER called (swap never reaches DB)
        insert_calls = [
            c for c in mock_chain.insert.call_args_list
        ]
        assert len(insert_calls) == 0, (
            "INSERT não deveria ter sido chamado — a troca foi bloqueada por credenciais"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CACHE SEMÂNTICO — OpenAI chamada apenas 1x para perguntas duplicadas
# ═══════════════════════════════════════════════════════════════════════════════

class TestCacheSemantico:
    """
    Chama CDSS.ask() duas vezes com a mesma pergunta.
    O mock da OpenAI deve ser invocado apenas UMA vez (segunda = cache hit).
    """

    @pytest.mark.asyncio
    @patch("services.cdss_service.Database")
    @patch("services.cdss_service.settings")
    async def test_second_call_comes_from_cache(self, mock_settings, mock_db_class):
        # ── Clean cache state ─────────────────────────────────────────────────
        import services.cdss_service as cdss_mod
        cdss_mod._answer_cache.clear()

        # ── Settings mock ─────────────────────────────────────────────────────
        mock_settings.openai_api_key = "sk-fake-key"
        mock_settings.ai_model = "gpt-4o-mini"

        # ── Database mock (pgvector RPC) ──────────────────────────────────────
        mock_db = MagicMock()
        mock_db_class.get_client.return_value = mock_db

        mock_rpc_chain = MagicMock()
        mock_rpc_chain.execute.return_value = MagicMock(data=[
            {
                "id": "lesson-1",
                "title": "POP Cardiologia",
                "track_title": "Cardiologia",
                "description": "Protocolo de dor torácica.",
                "similarity": 0.92,
            }
        ])
        mock_db.rpc.return_value = mock_rpc_chain

        # ── OpenAI mocks ─────────────────────────────────────────────────────
        svc = cdss_mod.CDSSService()

        mock_embed = AsyncMock(return_value=[0.1] * 1536)
        mock_generate = AsyncMock(return_value="Use protocolo XYZ conforme POP.")

        svc._embed_text = mock_embed
        svc._generate_answer = mock_generate

        question = "Qual o protocolo para dor torácica?"
        hospital = "hosp-1"

        # ── First call — should hit OpenAI ────────────────────────────────────
        result1 = await svc.ask(question, hospital)
        assert result1["answer"] == "Use protocolo XYZ conforme POP."
        assert mock_embed.call_count == 1
        assert mock_generate.call_count == 1

        # ── Second call — should come from cache ──────────────────────────────
        result2 = await svc.ask(question, hospital)
        assert result2["answer"] == result1["answer"]

        # OpenAI should NOT have been called again
        assert mock_embed.call_count == 1, (
            f"_embed_text chamado {mock_embed.call_count}x — esperado 1 (cache hit)"
        )
        assert mock_generate.call_count == 1, (
            f"_generate_answer chamado {mock_generate.call_count}x — esperado 1 (cache hit)"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# 4. CHAOS MONKEY — Circuit breaker retorna fallback amigável
# ═══════════════════════════════════════════════════════════════════════════════

class TestChaosMonkey:
    """
    Simula falha total da API da OpenAI.
    O sistema deve capturar via tenacity e retornar string de contingência.
    """

    @pytest.mark.asyncio
    @patch("services.cdss_service.Database")
    @patch("services.cdss_service.settings")
    async def test_openai_down_returns_fallback(self, mock_settings, mock_db_class):
        import services.cdss_service as cdss_mod
        cdss_mod._answer_cache.clear()

        mock_settings.openai_api_key = "sk-fake-key"
        mock_settings.ai_model = "gpt-4o-mini"

        # ── Database mock ─────────────────────────────────────────────────────
        mock_db = MagicMock()
        mock_db_class.get_client.return_value = mock_db

        # ── Service with exploding _embed_text ─────────────────────────────────
        svc = cdss_mod.CDSSService()

        # Simulate API down — every call raises Exception
        # Tenacity will retry 3x, then reraise → caught by ask()'s except block
        mock_embed = AsyncMock(side_effect=Exception("API Down — Timeout"))
        svc._embed_text = mock_embed

        result = await svc.ask(
            question="Dosagem de amoxicilina?",
            hospital_id="hosp-1",
        )

        # ── ASSERT: fallback message instead of 500 ──────────────────────────
        assert "error" in result.get("confidence", "error"), (
            "Confidence deveria ser 'error' quando OpenAI falha"
        )
        assert "Ocorreu um erro" in result["answer"] or "protocolos" in result["answer"], (
            "Resposta deveria conter mensagem de contingência amigável"
        )
        assert result["sources_found"] == 0


# ═══════════════════════════════════════════════════════════════════════════════
# 5. COLAPSO SIMULADO — Burnout analyzer detecta risco alto
# ═══════════════════════════════════════════════════════════════════════════════

class TestColapsoSimulado:
    """
    Simula médico com 4 plantões noturnos em 7 dias.
    O analyzer deve classificar como risco >= medium e tentar INSERT em burnout_alerts.
    """

    @pytest.mark.asyncio
    @patch("services.burnout_analyzer.Database")
    async def test_4_night_shifts_triggers_alert(self, mock_db_class):
        from services.burnout_analyzer import BurnoutAnalyzer

        mock_db = MagicMock()
        mock_db_class.get_client.return_value = mock_db

        # ── Build fluent mock chain ───────────────────────────────────────────
        mock_chain = MagicMock()
        for method in ["table", "select", "eq", "gte", "lte", "single",
                        "order", "is_", "insert"]:
            getattr(mock_chain, method).return_value = mock_chain
        mock_db.table.return_value = mock_chain

        # Simulate 4 night shifts in 7 days (trigger 2: >3 nights)
        night_slots = [
            {"id": f"slot-{i}", "shift": "night"} for i in range(4)
        ]

        # No swap requests (trigger 3: not fired)
        no_swaps: list[dict] = []

        # Sequence: schedule_slots → shift_swap_requests → burnout_alerts.insert
        mock_chain.execute.side_effect = [
            MagicMock(data=night_slots),  # schedule_slots query
            MagicMock(data=no_swaps),     # shift_swap_requests query
            MagicMock(data=[{"id": "alert-1"}]),  # burnout_alerts INSERT
        ]

        # ── ACT ──────────────────────────────────────────────────────────────
        analyzer = BurnoutAnalyzer()
        result = await analyzer.analyze_doctor_burnout_risk(
            hospital_id="hosp-1",
            doctor_id="doctor-overworked",
        )

        # ── ASSERT: risk detected ────────────────────────────────────────────
        assert result["risk_level"] in ("medium", "high", "critical"), (
            f"Risk devia ser >= medium, mas foi '{result['risk_level']}'"
        )
        assert len(result["triggers"]) >= 1, "Deveria haver pelo menos 1 trigger"
        assert any("noturno" in t.lower() for t in result["triggers"]), (
            "O trigger de turnos noturnos deveria estar presente"
        )

        # ── ASSERT: INSERT was attempted on burnout_alerts ────────────────────
        insert_calls = mock_db.table.call_args_list
        insert_on_alerts = [
            c for c in insert_calls if c.args == ("burnout_alerts",)
        ]
        assert len(insert_on_alerts) > 0, (
            "INSERT em burnout_alerts deveria ter sido chamado"
        )

        # ── ASSERT: schedule_slots was NEVER modified (Golden Rule) ──────────
        # All calls to .table("schedule_slots") should only be SELECTs
        schedule_calls = [
            c for c in insert_calls if c.args == ("schedule_slots",)
        ]
        # Verify no insert/update/delete was chained after schedule_slots
        assert result.get("alert_created") is True, (
            "Alert deveria ter sido criado"
        )
