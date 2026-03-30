"""
SL Academy Platform - PII Scrubber (Data Anonymization)
Lightweight regex-based utility that masks Personally Identifiable Information
before text is sent to external LLMs (OpenAI).

Masked patterns:
  - CPFs:       123.456.789-00 or 12345678900
  - Phones BR:  (11) 91234-5678, +55 11 91234-5678, 11912345678
  - Emails:     user@domain.tld

All matches are replaced with [DADO_SENSIVEL].
"""

from __future__ import annotations

import re

_PLACEHOLDER = "[DADO_SENSIVEL]"

# ── Patterns ───────────────────────────────────────────────────────────────────

# CPF: 123.456.789-00 or 12345678900 (11 consecutive digits)
_CPF_FORMATTED = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")
_CPF_RAW = re.compile(r"\b\d{11}\b")

# Brazilian phone numbers:
#   +55 (11) 91234-5678 | (11) 91234-5678 | 11 912345678 | +5511912345678
_PHONE_BR = re.compile(
    r"(?:\+55\s?)?"          # optional country code
    r"(?:\(?\d{2}\)?\s?)"   # area code (with or without parens)
    r"(?:9\s?)?"             # optional leading 9 for mobile
    r"\d{4}[\s-]?\d{4}\b"   # 8 digits with optional separator
)

# Email: standard RFC-like pattern (good enough for scrubbing, not validation)
_EMAIL = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)

# Order matters: more specific patterns first to avoid partial matches
_PATTERNS: list[re.Pattern] = [
    _EMAIL,
    _CPF_FORMATTED,
    _CPF_RAW,       # 11-digit raw CPF — BEFORE phone to avoid partial match
    _PHONE_BR,
]


# ── Public API ─────────────────────────────────────────────────────────────────

def scrub_pii(text: str) -> str:
    """
    Replace all PII patterns in *text* with [DADO_SENSIVEL].

    Designed to be called on user inputs before they reach the LLM.
    Returns the sanitised string; original is never mutated.

    >>> scrub_pii("Meu CPF é 123.456.789-00 e meu email é dr@hospital.com")
    'Meu CPF é [DADO_SENSIVEL] e meu email é [DADO_SENSIVEL]'
    """
    if not text:
        return text

    sanitised = text
    for pattern in _PATTERNS:
        sanitised = pattern.sub(_PLACEHOLDER, sanitised)
    return sanitised
