"""
SL Academy Platform - AI Service
Handles AI integration for recommendations and doubt summaries
"""

from openai import AsyncOpenAI
from core.config import settings
from typing import List, Dict, Optional
import logging
import asyncio

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered features using OpenAI"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.ai_model
        self.max_retries = 3
        self.retry_delay = 1.0
    
    async def _call_with_retry(self, func, *args, **kwargs):
        """Call OpenAI API with retry logic"""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                logger.warning(
                    f"AI API call failed (attempt {attempt + 1}/{self.max_retries}): {str(e)}"
                )
                
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
        
        logger.error(f"AI API call failed after {self.max_retries} attempts: {str(last_exception)}")
        raise last_exception
    
    async def generate_recommendations(
        self,
        pre_test_score: float,
        post_test_score: float,
        lesson_title: str,
        available_lessons: List[Dict]
    ) -> List[Dict[str, str]]:
        """
        Generate lesson recommendations based on test performance
        
        Args:
            pre_test_score: Pre-test score (0-100)
            post_test_score: Post-test score (0-100)
            lesson_title: Current lesson title
            available_lessons: List of available lessons with id, title, description
        
        Returns:
            List of 3-5 recommended lessons with reasons
        """
        try:
            improvement = post_test_score - pre_test_score
            
            # Build prompt
            prompt = f"""You are an educational advisor for healthcare professionals.

A doctor just completed a lesson titled "{lesson_title}".
- Pre-test score: {pre_test_score}%
- Post-test score: {post_test_score}%
- Improvement: {improvement}%

Based on this performance, recommend 3-5 lessons from the following list that would help them improve:

{self._format_lessons_for_prompt(available_lessons)}

For each recommendation, provide:
1. Lesson ID
2. Brief reason (1-2 sentences) why this lesson would help

Format your response as JSON array:
[
  {{"lesson_id": "uuid", "reason": "explanation"}},
  ...
]"""
            
            response = await self._call_with_retry(
                self.client.chat.completions.create,
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful educational advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Parse response
            import json
            recommendations_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            if "```json" in recommendations_text:
                recommendations_text = recommendations_text.split("```json")[1].split("```")[0].strip()
            elif "```" in recommendations_text:
                recommendations_text = recommendations_text.split("```")[1].split("```")[0].strip()
            
            recommendations = json.loads(recommendations_text)
            
            # Validate and limit to 3-5 recommendations
            recommendations = recommendations[:5]
            
            if len(recommendations) < 3:
                # Fallback: return first 3 available lessons
                return self._fallback_recommendations(available_lessons)
            
            return recommendations
        
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            # Graceful degradation: return fallback recommendations
            return self._fallback_recommendations(available_lessons)
    
    async def generate_doubt_summary(self, doubt_text: str) -> Optional[str]:
        """
        Generate AI summary for a doubt
        
        Args:
            doubt_text: Doubt text to summarize
        
        Returns:
            Summary text or None if generation fails
        """
        try:
            prompt = f"""Summarize the following question from a healthcare professional in 1-2 sentences:

"{doubt_text}"

Provide a clear, concise summary that captures the main question or concern."""
            
            response = await self._call_with_retry(
                self.client.chat.completions.create,
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes questions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=100
            )
            
            summary = response.choices[0].message.content.strip()
            return summary
        
        except Exception as e:
            logger.error(f"Error generating doubt summary: {str(e)}")
            # Graceful degradation: return None
            return None
    
    def _format_lessons_for_prompt(self, lessons: List[Dict]) -> str:
        """Format lessons for AI prompt"""
        formatted = []
        for lesson in lessons:
            formatted.append(
                f"- ID: {lesson['id']}\n"
                f"  Title: {lesson['title']}\n"
                f"  Description: {lesson.get('description', 'N/A')}"
            )
        return "\n\n".join(formatted)
    
    def _fallback_recommendations(self, available_lessons: List[Dict]) -> List[Dict[str, str]]:
        """Fallback recommendations when AI fails"""
        recommendations = []
        
        for lesson in available_lessons[:3]:
            recommendations.append({
                "lesson_id": lesson["id"],
                "reason": "This lesson covers related topics that may help reinforce your understanding."
            })
        
        return recommendations


# Global AI service instance
ai_service = AIService()
