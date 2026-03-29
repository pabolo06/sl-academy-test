"""
SL Academy Platform - AI Service (disabled)
OpenAI integration temporarily disabled. Re-enable by restoring full implementation
and setting OPENAI_API_KEY environment variable.
"""

from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

_AI_DISABLED_MSG = "AI features are temporarily unavailable."


class AIService:
    """Stub AI service — all methods return safe fallbacks without calling OpenAI."""

    async def generate_recommendations(
        self,
        _pre_test_score: float,
        _post_test_score: float,
        _lesson_title: str,
        available_lessons: List[Dict],
    ) -> List[Dict[str, str]]:
        return self._fallback_recommendations(available_lessons)

    async def generate_doubt_summary(self, _doubt_text: str) -> Optional[str]:
        return None

    async def generate_assistant_response(
        self,
        _messages: List[Dict[str, str]],
        _role: str,
        _hospital_context: Optional[str] = None,
    ) -> str:
        return _AI_DISABLED_MSG

    def _fallback_recommendations(self, available_lessons: List[Dict]) -> List[Dict[str, str]]:
        return [
            {
                "lesson_id": lesson["id"],
                "reason": "This lesson covers related topics that may help reinforce your understanding.",
            }
            for lesson in available_lessons[:3]
        ]


# Global AI service instance
ai_service = AIService()
