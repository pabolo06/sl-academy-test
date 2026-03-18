"""
Load testing script for SL Academy Platform using Locust.

Usage:
    locust -f locustfile.py --host=http://localhost:8000
    
    Then open http://localhost:8089 in browser
"""

from locust import HttpUser, task, between, events
import json
import random
from uuid import uuid4

# Test data
TEST_USERS = [
    {"email": "doctor1@hospital1.com", "password": "password123"},
    {"email": "doctor2@hospital1.com", "password": "password123"},
    {"email": "manager1@hospital1.com", "password": "password123"},
]

TEST_TRACK_IDS = []
TEST_LESSON_IDS = []
TEST_DOUBT_IDS = []


class SLAcademyUser(HttpUser):
    """Simulates a user interacting with SL Academy Platform."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Called when a simulated user starts. Performs login."""
        user = random.choice(TEST_USERS)
        
        response = self.client.post("/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        
        if response.status_code == 200:
            self.user_email = user["email"]
            self.is_manager = "manager" in user["email"]
        else:
            print(f"Login failed: {response.status_code}")
    
    @task(5)
    def view_tracks(self):
        """View track listing (most common action)."""
        with self.client.get("/api/tracks", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                # Store track IDs for other tasks
                if data and len(TEST_TRACK_IDS) < 10:
                    for track in data[:5]:
                        if track.get('id') not in TEST_TRACK_IDS:
                            TEST_TRACK_IDS.append(track['id'])
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(4)
    def view_lessons(self):
        """View lessons for a track."""
        if not TEST_TRACK_IDS:
            return
        
        track_id = random.choice(TEST_TRACK_IDS)
        
        with self.client.get(f"/api/tracks/{track_id}/lessons", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                # Store lesson IDs for other tasks
                if data and len(TEST_LESSON_IDS) < 20:
                    for lesson in data[:5]:
                        if lesson.get('id') not in TEST_LESSON_IDS:
                            TEST_LESSON_IDS.append(lesson['id'])
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(3)
    def view_lesson_detail(self):
        """View lesson detail page."""
        if not TEST_LESSON_IDS:
            return
        
        lesson_id = random.choice(TEST_LESSON_IDS)
        
        with self.client.get(f"/api/lessons/{lesson_id}", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def view_questions(self):
        """View test questions for a lesson."""
        if not TEST_LESSON_IDS:
            return
        
        lesson_id = random.choice(TEST_LESSON_IDS)
        test_type = random.choice(['pre', 'post'])
        
        with self.client.get(
            f"/api/lessons/{lesson_id}/questions",
            params={"type": test_type},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def submit_test(self):
        """Submit test attempt."""
        if not TEST_LESSON_IDS:
            return
        
        lesson_id = random.choice(TEST_LESSON_IDS)
        
        # Generate random answers
        answers = [
            {
                "question_id": str(uuid4()),
                "selected_option": random.randint(0, 3)
            }
            for _ in range(5)
        ]
        
        with self.client.post(
            "/api/test-attempts",
            json={
                "lesson_id": lesson_id,
                "test_type": "post",
                "answers": answers
            },
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            elif response.status_code == 400:
                # Expected for invalid question IDs
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def view_doubts(self):
        """View user's doubts."""
        with self.client.get("/api/doubts", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                # Store doubt IDs for managers
                if data and len(TEST_DOUBT_IDS) < 10:
                    for doubt in data[:5]:
                        if doubt.get('id') not in TEST_DOUBT_IDS:
                            TEST_DOUBT_IDS.append(doubt['id'])
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def create_doubt(self):
        """Create a new doubt."""
        if not TEST_LESSON_IDS:
            return
        
        lesson_id = random.choice(TEST_LESSON_IDS)
        
        with self.client.post(
            "/api/doubts",
            json={
                "lesson_id": lesson_id,
                "text": "This is a test doubt created during load testing. " * 5
            },
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            elif response.status_code == 429:
                # Rate limited - expected
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def view_indicators(self):
        """View indicators (manager only)."""
        if not self.is_manager:
            return
        
        with self.client.get(
            "/api/indicators",
            params={
                "startDate": "2024-01-01",
                "endDate": "2024-03-31"
            },
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def answer_doubt(self):
        """Answer a doubt (manager only)."""
        if not self.is_manager or not TEST_DOUBT_IDS:
            return
        
        doubt_id = random.choice(TEST_DOUBT_IDS)
        
        with self.client.patch(
            f"/api/doubts/{doubt_id}",
            json={
                "answer": "This is a test answer created during load testing."
            },
            catch_response=True
        ) as response:
            if response.status_code in [200, 404]:
                # 404 is OK - doubt might not exist
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")


class DoctorUser(SLAcademyUser):
    """Simulates a doctor user (most common)."""
    weight = 8  # 80% of users are doctors
    
    def on_start(self):
        """Login as doctor."""
        doctor = [u for u in TEST_USERS if "doctor" in u["email"]][0]
        
        response = self.client.post("/api/auth/login", json={
            "email": doctor["email"],
            "password": doctor["password"]
        })
        
        if response.status_code == 200:
            self.user_email = doctor["email"]
            self.is_manager = False


class ManagerUser(SLAcademyUser):
    """Simulates a manager user."""
    weight = 2  # 20% of users are managers
    
    def on_start(self):
        """Login as manager."""
        manager = [u for u in TEST_USERS if "manager" in u["email"]][0]
        
        response = self.client.post("/api/auth/login", json={
            "email": manager["email"],
            "password": manager["password"]
        })
        
        if response.status_code == 200:
            self.user_email = manager["email"]
            self.is_manager = True


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    print("=" * 60)
    print("SL Academy Platform - Load Test Starting")
    print("=" * 60)
    print(f"Target host: {environment.host}")
    print(f"Users: {environment.runner.target_user_count if hasattr(environment.runner, 'target_user_count') else 'N/A'}")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    print("=" * 60)
    print("SL Academy Platform - Load Test Complete")
    print("=" * 60)
    
    stats = environment.stats
    print(f"Total requests: {stats.total.num_requests}")
    print(f"Total failures: {stats.total.num_failures}")
    print(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    print(f"Min response time: {stats.total.min_response_time:.2f}ms")
    print(f"Max response time: {stats.total.max_response_time:.2f}ms")
    print(f"Requests per second: {stats.total.total_rps:.2f}")
    print("=" * 60)
