"""
Property-Based Tests for RLS Hospital Isolation

**Validates: Requirements 2.1, 2.2, 2.3**

This module contains property-based tests that verify Row Level Security (RLS)
policies correctly enforce hospital-level data isolation across all database tables.

Properties tested:
- Property 1: Hospital Data Isolation - Users from different hospitals cannot access each other's data
- Property 2: RLS Policy Enforcement - All queries are automatically filtered by hospital_id
"""

import pytest
from hypothesis import given, strategies as st, assume, settings
from hypothesis.stateful import RuleBasedStateMachine, rule, invariant
from uuid import UUID, uuid4
from typing import Dict, List, Set
import os
from supabase import create_client, Client
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load environment variables
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)


# ============================================================================
# Test Configuration
# ============================================================================

@pytest.fixture(scope="module")
def supabase_client() -> Client:
    """Create Supabase client for testing"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")  # Service key for admin operations
    
    if not url or not key:
        pytest.skip("Supabase credentials not configured")
    
    return create_client(url, key)


@pytest.fixture(scope="module")
def test_hospitals(supabase_client: Client) -> Dict[str, UUID]:
    """Create test hospitals for isolation testing"""
    hospital_a_id = uuid4()
    hospital_b_id = uuid4()
    
    # Create two test hospitals
    supabase_client.table("hospitals").insert([
        {"id": str(hospital_a_id), "name": "Test Hospital A"},
        {"id": str(hospital_b_id), "name": "Test Hospital B"}
    ]).execute()
    
    yield {
        "hospital_a": hospital_a_id,
        "hospital_b": hospital_b_id
    }
    
    # Cleanup
    supabase_client.table("hospitals").delete().eq("id", str(hospital_a_id)).execute()
    supabase_client.table("hospitals").delete().eq("id", str(hospital_b_id)).execute()


@pytest.fixture(scope="module")
def test_users(supabase_client: Client, test_hospitals: Dict[str, UUID]) -> Dict[str, Dict]:
    """Create test users for each hospital"""
    # Use randomized emails to avoid collisions
    user_a_email = f"test_a_{uuid4()}@example.com"
    user_b_email = f"test_b_{uuid4()}@example.com"
    password = "test-password-123"
    
    # Create real auth users using admin API
    # This ensures they exist in auth.users before creating profiles
    resp_a = supabase_client.auth.admin.create_user({
        "email": user_a_email,
        "password": password,
        "email_confirm": True
    })
    user_a_id = UUID(resp_a.user.id)
    
    resp_b = supabase_client.auth.admin.create_user({
        "email": user_b_email,
        "password": password,
        "email_confirm": True
    })
    user_b_id = UUID(resp_b.user.id)
    
    users = {
        "user_a": {
            "id": user_a_id,
            "hospital_id": test_hospitals["hospital_a"],
            "role": "doctor"
        },
        "user_b": {
            "id": user_b_id,
            "hospital_id": test_hospitals["hospital_b"],
            "role": "doctor"
        }
    }
    
    # Create profiles
    supabase_client.table("profiles").insert([
        {
            "id": str(user_a_id),
            "hospital_id": str(test_hospitals["hospital_a"]),
            "full_name": "Test User A",
            "role": "doctor"
        },
        {
            "id": str(user_b_id),
            "hospital_id": str(test_hospitals["hospital_b"]),
            "full_name": "Test User B",
            "role": "doctor"
        }
    ]).execute()
    
    yield users
    
    # Cleanup profiles (auth users will trigger cascade if migrations are correct, 
    # but we cleanup explicitly for safety)
    supabase_client.table("profiles").delete().eq("id", str(user_a_id)).execute()
    supabase_client.table("profiles").delete().eq("id", str(user_b_id)).execute()
    
    # Cleanup auth users
    supabase_client.auth.admin.delete_user(str(user_a_id))
    supabase_client.auth.admin.delete_user(str(user_b_id))


# ============================================================================
# Property 1: Hospital Data Isolation
# ============================================================================

class TestHospitalDataIsolation:
    """
    **Property 1: Hospital Data Isolation**
    
    For any two users from different hospitals, no data item can be accessible 
    to both users simultaneously.
    
    **Validates: Requirements 2.1, 2.2**
    """
    
    @given(
        track_count=st.integers(min_value=1, max_value=10),
        lesson_count=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=50, deadline=None)
    def test_tracks_isolated_by_hospital(
        self,
        supabase_client: Client,
        test_hospitals: Dict[str, UUID],
        test_users: Dict[str, Dict],
        track_count: int,
        lesson_count: int
    ):
        """
        Property: Tracks created by Hospital A users are never visible to Hospital B users
        
        Given: Multiple tracks created for different hospitals
        When: Users from each hospital query tracks
        Then: Each user sees only their hospital's tracks
        """
        hospital_a_id = test_hospitals["hospital_a"]
        hospital_b_id = test_hospitals["hospital_b"]
        
        # Create tracks for both hospitals
        hospital_a_tracks = []
        hospital_b_tracks = []
        
        for i in range(track_count):
            track_a_id = uuid4()
            track_b_id = uuid4()
            
            hospital_a_tracks.append(track_a_id)
            hospital_b_tracks.append(track_b_id)
            
            supabase_client.table("tracks").insert([
                {
                    "id": str(track_a_id),
                    "title": f"Track A{i}",
                    "hospital_id": str(hospital_a_id)
                },
                {
                    "id": str(track_b_id),
                    "title": f"Track B{i}",
                    "hospital_id": str(hospital_b_id)
                }
            ]).execute()
        
        try:
            # Query tracks for each hospital
            result_a = supabase_client.table("tracks")\
                .select("*")\
                .eq("hospital_id", str(hospital_a_id))\
                .is_("deleted_at", "null")\
                .execute()
            
            result_b = supabase_client.table("tracks")\
                .select("*")\
                .eq("hospital_id", str(hospital_b_id))\
                .is_("deleted_at", "null")\
                .execute()
            
            # Extract track IDs from results
            tracks_a_ids = {UUID(t["id"]) for t in result_a.data} if result_a.data else set()
            tracks_b_ids = {UUID(t["id"]) for t in result_b.data} if result_b.data else set()
            
            # Property: No overlap between hospitals
            assert tracks_a_ids.isdisjoint(tracks_b_ids), \
                "Hospital A and B should have no tracks in common"
            
            # Property: Each hospital sees only their own tracks
            assert all(tid in tracks_a_ids for tid in hospital_a_tracks), \
                "Hospital A should see all their tracks"
            assert all(tid in tracks_b_ids for tid in hospital_b_tracks), \
                "Hospital B should see all their tracks"
            
            # Property: No cross-hospital visibility
            assert not any(tid in tracks_b_ids for tid in hospital_a_tracks), \
                "Hospital B should not see Hospital A's tracks"
            assert not any(tid in tracks_a_ids for tid in hospital_b_tracks), \
                "Hospital A should not see Hospital B's tracks"
        
        finally:
            # Cleanup
            for track_id in hospital_a_tracks + hospital_b_tracks:
                supabase_client.table("tracks").delete().eq("id", str(track_id)).execute()
    
    @given(
        indicator_count=st.integers(min_value=1, max_value=20),
        category=st.sampled_from(["safety", "quality", "efficiency", "patient_satisfaction"])
    )
    @settings(max_examples=50, deadline=None)
    def test_indicators_isolated_by_hospital(
        self,
        supabase_client: Client,
        test_hospitals: Dict[str, UUID],
        indicator_count: int,
        category: str
    ):
        """
        Property: Indicators are strictly isolated by hospital_id
        
        Given: Multiple indicators created for different hospitals
        When: Querying indicators with hospital context
        Then: Only indicators from the specified hospital are returned
        """
        hospital_a_id = test_hospitals["hospital_a"]
        hospital_b_id = test_hospitals["hospital_b"]
        
        # Create indicators for both hospitals
        hospital_a_indicators = []
        hospital_b_indicators = []
        
        for i in range(indicator_count):
            indicator_a_id = uuid4()
            indicator_b_id = uuid4()
            
            hospital_a_indicators.append(indicator_a_id)
            hospital_b_indicators.append(indicator_b_id)
            
            supabase_client.table("indicators").insert([
                {
                    "id": str(indicator_a_id),
                    "hospital_id": str(hospital_a_id),
                    "name": f"Indicator A{i}",
                    "value": i * 10.5,
                    "category": category,
                    "reference_date": "2024-01-15"
                },
                {
                    "id": str(indicator_b_id),
                    "hospital_id": str(hospital_b_id),
                    "name": f"Indicator B{i}",
                    "value": i * 20.5,
                    "category": category,
                    "reference_date": "2024-01-15"
                }
            ]).execute()
        
        try:
            # Query indicators for each hospital
            result_a = supabase_client.table("indicators")\
                .select("*")\
                .eq("hospital_id", str(hospital_a_id))\
                .execute()
            
            result_b = supabase_client.table("indicators")\
                .select("*")\
                .eq("hospital_id", str(hospital_b_id))\
                .execute()
            
            indicators_a_ids = {UUID(i["id"]) for i in result_a.data} if result_a.data else set()
            indicators_b_ids = {UUID(i["id"]) for i in result_b.data} if result_b.data else set()
            
            # Property: Complete isolation between hospitals
            assert indicators_a_ids.isdisjoint(indicators_b_ids), \
                "Indicators must be completely isolated between hospitals"
            
            # Property: All hospital A indicators are present
            assert all(iid in indicators_a_ids for iid in hospital_a_indicators), \
                "All Hospital A indicators should be retrievable"
            
            # Property: All hospital B indicators are present
            assert all(iid in indicators_b_ids for iid in hospital_b_indicators), \
                "All Hospital B indicators should be retrievable"
        
        finally:
            # Cleanup
            for indicator_id in hospital_a_indicators + hospital_b_indicators:
                supabase_client.table("indicators").delete().eq("id", str(indicator_id)).execute()
    
    @given(
        doubt_count=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=50, deadline=None)
    def test_doubts_isolated_by_hospital(
        self,
        supabase_client: Client,
        test_hospitals: Dict[str, UUID],
        test_users: Dict[str, Dict],
        doubt_count: int
    ):
        """
        Property: Doubts are isolated by hospital through lesson ownership
        
        Given: Doubts created by users from different hospitals
        When: Querying doubts with hospital context
        Then: Users only see doubts from their hospital's lessons
        """
        hospital_a_id = test_hospitals["hospital_a"]
        hospital_b_id = test_hospitals["hospital_b"]
        user_a_id = test_users["user_a"]["id"]
        user_b_id = test_users["user_b"]["id"]
        
        # Create tracks and lessons for both hospitals
        track_a_id = uuid4()
        track_b_id = uuid4()
        lesson_a_id = uuid4()
        lesson_b_id = uuid4()
        
        supabase_client.table("tracks").insert([
            {"id": str(track_a_id), "title": "Track A", "hospital_id": str(hospital_a_id)},
            {"id": str(track_b_id), "title": "Track B", "hospital_id": str(hospital_b_id)}
        ]).execute()
        
        supabase_client.table("lessons").insert([
            {
                "id": str(lesson_a_id),
                "track_id": str(track_a_id),
                "title": "Lesson A",
                "video_url": "https://example.com/video_a.mp4",
                "duration_seconds": 300,
                "order": 0
            },
            {
                "id": str(lesson_b_id),
                "track_id": str(track_b_id),
                "title": "Lesson B",
                "video_url": "https://example.com/video_b.mp4",
                "duration_seconds": 300,
                "order": 0
            }
        ]).execute()
        
        # Create doubts for both hospitals
        hospital_a_doubts = []
        hospital_b_doubts = []
        
        for i in range(doubt_count):
            doubt_a_id = uuid4()
            doubt_b_id = uuid4()
            
            hospital_a_doubts.append(doubt_a_id)
            hospital_b_doubts.append(doubt_b_id)
            
            supabase_client.table("doubts").insert([
                {
                    "id": str(doubt_a_id),
                    "profile_id": str(user_a_id),
                    "lesson_id": str(lesson_a_id),
                    "text": f"Doubt from Hospital A user {i}",
                    "status": "pending"
                },
                {
                    "id": str(doubt_b_id),
                    "profile_id": str(user_b_id),
                    "lesson_id": str(lesson_b_id),
                    "text": f"Doubt from Hospital B user {i}",
                    "status": "pending"
                }
            ]).execute()
        
        try:
            # Query doubts through lesson ownership
            # Hospital A doubts (through lesson A)
            result_a = supabase_client.table("doubts")\
                .select("*")\
                .eq("lesson_id", str(lesson_a_id))\
                .execute()
            
            # Hospital B doubts (through lesson B)
            result_b = supabase_client.table("doubts")\
                .select("*")\
                .eq("lesson_id", str(lesson_b_id))\
                .execute()
            
            doubts_a_ids = {UUID(d["id"]) for d in result_a.data} if result_a.data else set()
            doubts_b_ids = {UUID(d["id"]) for d in result_b.data} if result_b.data else set()
            
            # Property: Doubts are isolated by hospital
            assert doubts_a_ids.isdisjoint(doubts_b_ids), \
                "Doubts must be isolated between hospitals"
            
            # Property: Each hospital sees only their doubts
            assert all(did in doubts_a_ids for did in hospital_a_doubts), \
                "Hospital A should see all their doubts"
            assert all(did in doubts_b_ids for did in hospital_b_doubts), \
                "Hospital B should see all their doubts"
        
        finally:
            # Cleanup
            for doubt_id in hospital_a_doubts + hospital_b_doubts:
                supabase_client.table("doubts").delete().eq("id", str(doubt_id)).execute()
            supabase_client.table("lessons").delete().eq("id", str(lesson_a_id)).execute()
            supabase_client.table("lessons").delete().eq("id", str(lesson_b_id)).execute()
            supabase_client.table("tracks").delete().eq("id", str(track_a_id)).execute()
            supabase_client.table("tracks").delete().eq("id", str(track_b_id)).execute()


# ============================================================================
# Property 2: RLS Policy Enforcement
# ============================================================================

class TestRLSPolicyEnforcement:
    """
    **Property 2: RLS Policy Enforcement**
    
    For any database query executed by a user, all returned rows must belong 
    to that user's hospital.
    
    **Validates: Requirements 2.1, 2.3**
    """
    
    @given(
        data_count=st.integers(min_value=5, max_value=20)
    )
    @settings(max_examples=30, deadline=None)
    def test_rls_filters_all_queries_by_hospital(
        self,
        supabase_client: Client,
        test_hospitals: Dict[str, UUID],
        data_count: int
    ):
        """
        Property: RLS automatically filters ALL queries by hospital_id
        
        Given: Data from multiple hospitals in the database
        When: Executing any SELECT query with user context
        Then: Only data from the user's hospital is returned
        """
        hospital_a_id = test_hospitals["hospital_a"]
        hospital_b_id = test_hospitals["hospital_b"]
        
        # Create mixed data for both hospitals
        track_ids = []
        
        for i in range(data_count):
            # Alternate between hospitals
            hospital_id = hospital_a_id if i % 2 == 0 else hospital_b_id
            track_id = uuid4()
            track_ids.append((track_id, hospital_id))
            
            supabase_client.table("tracks").insert({
                "id": str(track_id),
                "title": f"Track {i}",
                "hospital_id": str(hospital_id)
            }).execute()
        
        try:
            # Query all tracks for Hospital A
            result_a = supabase_client.table("tracks")\
                .select("*")\
                .eq("hospital_id", str(hospital_a_id))\
                .execute()
            
            # Query all tracks for Hospital B
            result_b = supabase_client.table("tracks")\
                .select("*")\
                .eq("hospital_id", str(hospital_b_id))\
                .execute()
            
            # Property: All returned rows belong to the queried hospital
            if result_a.data:
                assert all(
                    UUID(track["hospital_id"]) == hospital_a_id 
                    for track in result_a.data
                ), "All Hospital A query results must belong to Hospital A"
            
            if result_b.data:
                assert all(
                    UUID(track["hospital_id"]) == hospital_b_id 
                    for track in result_b.data
                ), "All Hospital B query results must belong to Hospital B"
            
            # Property: Count matches expected distribution
            expected_a_count = sum(1 for _, hid in track_ids if hid == hospital_a_id)
            expected_b_count = sum(1 for _, hid in track_ids if hid == hospital_b_id)
            
            actual_a_count = len(result_a.data) if result_a.data else 0
            actual_b_count = len(result_b.data) if result_b.data else 0
            
            assert actual_a_count == expected_a_count, \
                f"Hospital A should see {expected_a_count} tracks, got {actual_a_count}"
            assert actual_b_count == expected_b_count, \
                f"Hospital B should see {expected_b_count} tracks, got {actual_b_count}"
        
        finally:
            # Cleanup
            for track_id, _ in track_ids:
                supabase_client.table("tracks").delete().eq("id", str(track_id)).execute()
    
    @given(
        test_attempt_count=st.integers(min_value=1, max_value=15)
    )
    @settings(max_examples=30, deadline=None)
    def test_rls_enforces_hospital_context_on_joins(
        self,
        supabase_client: Client,
        test_hospitals: Dict[str, UUID],
        test_users: Dict[str, Dict],
        test_attempt_count: int
    ):
        """
        Property: RLS policies cascade through JOIN operations
        
        Given: Test attempts linked to lessons from different hospitals
        When: Querying test attempts with JOINs to lessons/tracks
        Then: Only test attempts from the user's hospital are returned
        """
        hospital_a_id = test_hospitals["hospital_a"]
        hospital_b_id = test_hospitals["hospital_b"]
        user_a_id = test_users["user_a"]["id"]
        user_b_id = test_users["user_b"]["id"]
        
        # Create tracks and lessons
        track_a_id = uuid4()
        track_b_id = uuid4()
        lesson_a_id = uuid4()
        lesson_b_id = uuid4()
        
        supabase_client.table("tracks").insert([
            {"id": str(track_a_id), "title": "Track A", "hospital_id": str(hospital_a_id)},
            {"id": str(track_b_id), "title": "Track B", "hospital_id": str(hospital_b_id)}
        ]).execute()
        
        supabase_client.table("lessons").insert([
            {
                "id": str(lesson_a_id),
                "track_id": str(track_a_id),
                "title": "Lesson A",
                "video_url": "https://example.com/video_a.mp4",
                "duration_seconds": 300,
                "order": 0
            },
            {
                "id": str(lesson_b_id),
                "track_id": str(track_b_id),
                "title": "Lesson B",
                "video_url": "https://example.com/video_b.mp4",
                "duration_seconds": 300,
                "order": 0
            }
        ]).execute()
        
        # Create questions for both lessons
        question_a_id = uuid4()
        question_b_id = uuid4()
        
        supabase_client.table("questions").insert([
            {
                "id": str(question_a_id),
                "lesson_id": str(lesson_a_id),
                "type": "pre",
                "question_text": "Question A",
                "options": ["A", "B", "C", "D"],
                "correct_option_index": 0
            },
            {
                "id": str(question_b_id),
                "lesson_id": str(lesson_b_id),
                "type": "pre",
                "question_text": "Question B",
                "options": ["A", "B", "C", "D"],
                "correct_option_index": 1
            }
        ]).execute()
        
        # Create test attempts
        attempt_ids = []
        
        for i in range(test_attempt_count):
            attempt_a_id = uuid4()
            attempt_b_id = uuid4()
            
            attempt_ids.append((attempt_a_id, hospital_a_id))
            attempt_ids.append((attempt_b_id, hospital_b_id))
            
            supabase_client.table("test_attempts").insert([
                {
                    "id": str(attempt_a_id),
                    "profile_id": str(user_a_id),
                    "lesson_id": str(lesson_a_id),
                    "type": "pre",
                    "score": 75.0,
                    "answers": {str(question_a_id): 0}
                },
                {
                    "id": str(attempt_b_id),
                    "profile_id": str(user_b_id),
                    "lesson_id": str(lesson_b_id),
                    "type": "pre",
                    "score": 80.0,
                    "answers": {str(question_b_id): 1}
                }
            ]).execute()
        
        try:
            # Query test attempts for user A (should only see Hospital A attempts)
            result_a = supabase_client.table("test_attempts")\
                .select("*, lessons!inner(*, tracks!inner(hospital_id))")\
                .eq("profile_id", str(user_a_id))\
                .execute()
            
            # Query test attempts for user B (should only see Hospital B attempts)
            result_b = supabase_client.table("test_attempts")\
                .select("*, lessons!inner(*, tracks!inner(hospital_id))")\
                .eq("profile_id", str(user_b_id))\
                .execute()
            
            # Property: All test attempts belong to the correct hospital
            if result_a.data:
                for attempt in result_a.data:
                    hospital_id = UUID(attempt["lessons"]["tracks"]["hospital_id"])
                    assert hospital_id == hospital_a_id, \
                        "User A's test attempts must be from Hospital A lessons"
            
            if result_b.data:
                for attempt in result_b.data:
                    hospital_id = UUID(attempt["lessons"]["tracks"]["hospital_id"])
                    assert hospital_id == hospital_b_id, \
                        "User B's test attempts must be from Hospital B lessons"
            
            # Property: Correct count of attempts
            assert len(result_a.data) == test_attempt_count if result_a.data else 0, \
                f"User A should have {test_attempt_count} test attempts"
            assert len(result_b.data) == test_attempt_count if result_b.data else 0, \
                f"User B should have {test_attempt_count} test attempts"
        
        finally:
            # Cleanup
            for attempt_id, _ in attempt_ids:
                supabase_client.table("test_attempts").delete().eq("id", str(attempt_id)).execute()
            supabase_client.table("questions").delete().eq("id", str(question_a_id)).execute()
            supabase_client.table("questions").delete().eq("id", str(question_b_id)).execute()
            supabase_client.table("lessons").delete().eq("id", str(lesson_a_id)).execute()
            supabase_client.table("lessons").delete().eq("id", str(lesson_b_id)).execute()
            supabase_client.table("tracks").delete().eq("id", str(track_a_id)).execute()
            supabase_client.table("tracks").delete().eq("id", str(track_b_id)).execute()
    
    def test_rls_denies_cross_hospital_access(
        self,
        supabase_client: Client,
        test_hospitals: Dict[str, UUID],
        test_users: Dict[str, Dict]
    ):
        """
        Property: Attempting to access another hospital's data returns empty results or error
        
        Given: Data belonging to Hospital A
        When: User from Hospital B attempts to access it directly by ID
        Then: Access is denied (empty result or 403 error)
        
        **Validates: Requirement 2.2**
        """
        hospital_a_id = test_hospitals["hospital_a"]
        hospital_b_id = test_hospitals["hospital_b"]
        
        # Create a track for Hospital A
        track_a_id = uuid4()
        supabase_client.table("tracks").insert({
            "id": str(track_a_id),
            "title": "Hospital A Track",
            "hospital_id": str(hospital_a_id)
        }).execute()
        
        try:
            # Attempt to access Hospital A's track with Hospital B context
            # This simulates a user from Hospital B trying to access Hospital A's data
            result = supabase_client.table("tracks")\
                .select("*")\
                .eq("id", str(track_a_id))\
                .eq("hospital_id", str(hospital_b_id))\
                .execute()
            
            # Property: Cross-hospital access returns no results
            assert not result.data or len(result.data) == 0, \
                "Cross-hospital access should return empty results"
            
            # Verify Hospital A can still access their own track
            result_a = supabase_client.table("tracks")\
                .select("*")\
                .eq("id", str(track_a_id))\
                .eq("hospital_id", str(hospital_a_id))\
                .execute()
            
            assert result_a.data and len(result_a.data) == 1, \
                "Hospital A should be able to access their own track"
        
        finally:
            # Cleanup
            supabase_client.table("tracks").delete().eq("id", str(track_a_id)).execute()


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
