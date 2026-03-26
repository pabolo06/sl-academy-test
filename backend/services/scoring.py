"""
SL Academy Platform - Test Scoring Service
Calculates test scores and validates answers
"""

from typing import List, Dict, Tuple
from uuid import UUID
from models.tests import TestScore, TestAttemptAnswer
from supabase import Client


class ScoringService:
    """Service for calculating test scores"""
    
    @staticmethod
    def calculate_score(
        answers: List[TestAttemptAnswer],
        correct_answers: Dict[UUID, int]
    ) -> TestScore:
        """
        Calculate test score from answers
        
        Args:
            answers: List of user answers
            correct_answers: Dict mapping question_id to correct_option_index
        
        Returns:
            TestScore with score (0-100), correct count, and pass status
        
        Raises:
            ValueError: If not all questions have answers
        """
        # Validate all questions have answers
        answered_questions = {answer.question_id for answer in answers}
        required_questions = set(correct_answers.keys())
        
        if answered_questions != required_questions:
            missing = required_questions - answered_questions
            extra = answered_questions - required_questions
            
            error_parts = []
            if missing:
                error_parts.append(f"Missing answers for questions: {missing}")
            if extra:
                error_parts.append(f"Extra answers for unknown questions: {extra}")
            
            raise ValueError(". ".join(error_parts))
        
        # Calculate correct answers
        correct_count = 0
        total_count = len(answers)
        
        for answer in answers:
            if correct_answers[answer.question_id] == answer.selected_option_index:
                correct_count += 1
        
        # Calculate percentage score
        score = (correct_count / total_count * 100) if total_count > 0 else 0.0
        
        # Ensure score is between 0 and 100
        score = max(0.0, min(100.0, score))
        
        from core.config import settings
        passed = score >= settings.scoring_pass_threshold
        
        return TestScore(
            score=round(score, 2),
            correct_count=correct_count,
            total_count=total_count,
            passed=passed
        )
    
    @staticmethod
    async def get_correct_answers(
        db: Client,
        lesson_id: UUID,
        question_type: str
    ) -> Dict[UUID, int]:
        """
        Get correct answers for lesson questions
        
        Args:
            db: Supabase client
            lesson_id: Lesson UUID
            question_type: Question type (pre/post)
        
        Returns:
            Dict mapping question_id to correct_option_index
        """
        response = db.table("questions").select(
            "id, correct_option_index"
        ).eq("lesson_id", str(lesson_id)).eq("type", question_type).is_("deleted_at", "null").execute()
        
        return {
            UUID(q["id"]): q["correct_option_index"]
            for q in response.data
        }
    
    @staticmethod
    def calculate_improvement(
        pre_test_score: float,
        post_test_score: float
    ) -> Tuple[float, float]:
        """
        Calculate improvement from pre-test to post-test
        
        Args:
            pre_test_score: Pre-test score (0-100)
            post_test_score: Post-test score (0-100)
        
        Returns:
            Tuple of (absolute_improvement, percentage_improvement)
        """
        absolute_improvement = post_test_score - pre_test_score
        
        # Calculate percentage improvement
        # If pre-test was 0, use post-test score as improvement percentage
        if pre_test_score == 0:
            percentage_improvement = post_test_score
        else:
            percentage_improvement = (absolute_improvement / pre_test_score) * 100
        
        return (
            round(absolute_improvement, 2),
            round(percentage_improvement, 2)
        )


# Global scoring service instance
scoring_service = ScoringService()
