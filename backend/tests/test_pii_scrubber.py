"""
Tests for the PII Scrubber utility (backend/utils/pii_scrubber.py).

Validates that CPFs, emails, and Brazilian phone numbers are correctly
masked with [DADO_SENSIVEL] before reaching the LLM.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.pii_scrubber import scrub_pii


class TestScrubPII:
    """PII Scrubber — regex masking unit tests."""

    # ── CPF ────────────────────────────────────────────────────────────────────

    def test_cpf_formatted(self):
        assert scrub_pii("Meu CPF é 123.456.789-00") == "Meu CPF é [DADO_SENSIVEL]"

    def test_cpf_raw_11_digits(self):
        assert scrub_pii("CPF: 12345678900") == "CPF: [DADO_SENSIVEL]"

    # ── Email ──────────────────────────────────────────────────────────────────

    def test_email_simple(self):
        assert scrub_pii("Envie para dr.joao@hospital.com.br") == "Envie para [DADO_SENSIVEL]"

    def test_email_with_plus(self):
        assert scrub_pii("user+tag@gmail.com") == "[DADO_SENSIVEL]"

    # ── Phone BR ───────────────────────────────────────────────────────────────

    def test_phone_with_parens(self):
        result = scrub_pii("Ligue para (11) 91234-5678")
        assert "[DADO_SENSIVEL]" in result
        assert "91234-5678" not in result

    def test_phone_with_country_code(self):
        result = scrub_pii("WhatsApp: +55 21 98765-4321")
        assert "[DADO_SENSIVEL]" in result
        assert "98765" not in result

    # ── Edge cases ─────────────────────────────────────────────────────────────

    def test_no_pii_unchanged(self):
        text = "Qual a dosagem de amoxicilina para pneumonia comunitária?"
        assert scrub_pii(text) == text

    def test_empty_string(self):
        assert scrub_pii("") == ""

    def test_none_passthrough(self):
        assert scrub_pii(None) is None

    def test_multiple_pii_in_same_string(self):
        text = "Dr. João (CPF 123.456.789-00) email: dr@hosp.com tel (11) 91234-5678"
        result = scrub_pii(text)
        assert "123.456.789-00" not in result
        assert "dr@hosp.com" not in result
        assert "91234-5678" not in result
        assert result.count("[DADO_SENSIVEL]") >= 3

    def test_original_string_not_mutated(self):
        original = "CPF: 123.456.789-00"
        _ = scrub_pii(original)
        assert original == "CPF: 123.456.789-00"
