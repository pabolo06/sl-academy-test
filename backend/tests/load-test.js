/**
 * k6 load testing script for SL Academy Platform
 * 
 * Usage:
 *   k6 run load-test.js
 *   k6 run --vus 100 --duration 30s load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginDuration = new Trend('login_duration');
const tracksDuration = new Trend('tracks_duration');
const lessonsDuration = new Trend('lessons_duration');
const testSubmissionDuration = new Trend('test_submission_duration');
const errorRate = new Rate('errors');
const successfulLogins = new Counter('successful_logins');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 50 },   // Ramp down to 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.01'],                  // Error rate < 1%
    'login_duration': ['p(95)<300'],                   // Login < 300ms at p95
    'tracks_duration': ['p(95)<200'],                  // Tracks < 200ms at p95
    'lessons_duration': ['p(95)<300'],                 // Lessons < 300ms at p95
    'test_submission_duration': ['p(95)<800'],         // Test submission < 800ms at p95
    'errors': ['rate<0.01'],                           // Error rate < 1%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const TEST_USERS = [
  { email: 'doctor1@hospital1.com', password: 'password123', role: 'doctor' },
  { email: 'doctor2@hospital1.com', password: 'password123', role: 'doctor' },
  { email: 'manager1@hospital1.com', password: 'password123', role: 'manager' },
];

// Helper functions
function randomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Main test scenario
export default function () {
  const user = randomUser();
  let cookies = {};
  let trackIds = [];
  let lessonIds = [];
  
  // 1. Login
  group('Authentication', function () {
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    
    const loginParams = {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    };
    
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      loginPayload,
      loginParams
    );
    
    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login has session cookie': (r) => r.cookies.sl_academy_session !== undefined,
    });
    
    if (loginSuccess) {
      successfulLogins.add(1);
      cookies = loginRes.cookies;
      loginDuration.add(loginRes.timings.duration);
    } else {
      errorRate.add(1);
      console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
      return; // Skip rest of scenario if login fails
    }
  });
  
  sleep(1);
  
  // 2. View tracks
  group('Browse Tracks', function () {
    const tracksRes = http.get(`${BASE_URL}/api/tracks`, {
      cookies: cookies,
      tags: { name: 'GetTracks' },
    });
    
    const tracksSuccess = check(tracksRes, {
      'tracks status is 200': (r) => r.status === 200,
      'tracks response time OK': (r) => r.timings.duration < 500,
      'tracks has data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) && data.length > 0;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (tracksSuccess) {
      tracksDuration.add(tracksRes.timings.duration);
      try {
        const tracks = JSON.parse(tracksRes.body);
        trackIds = tracks.slice(0, 5).map(t => t.id);
      } catch (e) {
        console.error('Failed to parse tracks response');
      }
    } else {
      errorRate.add(1);
    }
  });
  
  sleep(1);
  
  // 3. View lessons for a track
  if (trackIds.length > 0) {
    group('Browse Lessons', function () {
      const trackId = randomElement(trackIds);
      
      const lessonsRes = http.get(
        `${BASE_URL}/api/tracks/${trackId}/lessons`,
        {
          cookies: cookies,
          tags: { name: 'GetLessons' },
        }
      );
      
      const lessonsSuccess = check(lessonsRes, {
        'lessons status is 200': (r) => r.status === 200,
        'lessons response time OK': (r) => r.timings.duration < 500,
      });
      
      if (lessonsSuccess) {
        lessonsDuration.add(lessonsRes.timings.duration);
        try {
          const lessons = JSON.parse(lessonsRes.body);
          lessonIds = lessons.slice(0, 5).map(l => l.id);
        } catch (e) {
          console.error('Failed to parse lessons response');
        }
      } else {
        errorRate.add(1);
      }
    });
    
    sleep(1);
  }
  
  // 4. View lesson detail
  if (lessonIds.length > 0) {
    group('View Lesson', function () {
      const lessonId = randomElement(lessonIds);
      
      const lessonRes = http.get(
        `${BASE_URL}/api/lessons/${lessonId}`,
        {
          cookies: cookies,
          tags: { name: 'GetLesson' },
        }
      );
      
      check(lessonRes, {
        'lesson status is 200': (r) => r.status === 200,
        'lesson response time OK': (r) => r.timings.duration < 500,
      }) || errorRate.add(1);
    });
    
    sleep(2);
  }
  
  // 5. View test questions
  if (lessonIds.length > 0) {
    group('View Questions', function () {
      const lessonId = randomElement(lessonIds);
      const testType = Math.random() > 0.5 ? 'pre' : 'post';
      
      const questionsRes = http.get(
        `${BASE_URL}/api/lessons/${lessonId}/questions?type=${testType}`,
        {
          cookies: cookies,
          tags: { name: 'GetQuestions' },
        }
      );
      
      check(questionsRes, {
        'questions status is 200': (r) => r.status === 200,
        'questions response time OK': (r) => r.timings.duration < 500,
      }) || errorRate.add(1);
    });
    
    sleep(1);
  }
  
  // 6. Submit test (20% of users)
  if (lessonIds.length > 0 && Math.random() < 0.2) {
    group('Submit Test', function () {
      const lessonId = randomElement(lessonIds);
      
      // Generate random answers
      const answers = Array.from({ length: 5 }, () => ({
        question_id: `q${Math.floor(Math.random() * 1000)}`,
        selected_option: Math.floor(Math.random() * 4),
      }));
      
      const testPayload = JSON.stringify({
        lesson_id: lessonId,
        test_type: 'post',
        answers: answers,
      });
      
      const testRes = http.post(
        `${BASE_URL}/api/test-attempts`,
        testPayload,
        {
          cookies: cookies,
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'SubmitTest' },
        }
      );
      
      const testSuccess = check(testRes, {
        'test submission status is 200 or 201': (r) => [200, 201].includes(r.status),
        'test submission response time OK': (r) => r.timings.duration < 1000,
      });
      
      if (testSuccess) {
        testSubmissionDuration.add(testRes.timings.duration);
      } else if (testRes.status !== 400) {
        // 400 is expected for invalid question IDs
        errorRate.add(1);
      }
    });
    
    sleep(1);
  }
  
  // 7. View doubts
  group('View Doubts', function () {
    const doubtsRes = http.get(`${BASE_URL}/api/doubts`, {
      cookies: cookies,
      tags: { name: 'GetDoubts' },
    });
    
    check(doubtsRes, {
      'doubts status is 200': (r) => r.status === 200,
      'doubts response time OK': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });
  
  sleep(1);
  
  // 8. View indicators (managers only)
  if (user.role === 'manager') {
    group('View Indicators', function () {
      const indicatorsRes = http.get(
        `${BASE_URL}/api/indicators?startDate=2024-01-01&endDate=2024-03-31`,
        {
          cookies: cookies,
          tags: { name: 'GetIndicators' },
        }
      );
      
      check(indicatorsRes, {
        'indicators status is 200': (r) => r.status === 200,
        'indicators response time OK': (r) => r.timings.duration < 1000,
      }) || errorRate.add(1);
    });
    
    sleep(1);
  }
  
  // Random think time between iterations
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Summary handler
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}========================================\n`;
  summary += `${indent}  SL Academy Platform - Load Test Results\n`;
  summary += `${indent}========================================\n\n`;
  
  // Overall stats
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += `${indent}Data Received: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB\n`;
  summary += `${indent}Data Sent: ${(data.metrics.data_sent.values.count / 1024 / 1024).toFixed(2)} MB\n\n`;
  
  // Response times
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  summary += `${indent}  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  Med: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += `${indent}  p90: ${data.metrics.http_req_duration.values['p(90)'].toFixed(2)}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  
  // Custom metrics
  if (data.metrics.login_duration) {
    summary += `${indent}Login Duration (p95): ${data.metrics.login_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.tracks_duration) {
    summary += `${indent}Tracks Duration (p95): ${data.metrics.tracks_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.lessons_duration) {
    summary += `${indent}Lessons Duration (p95): ${data.metrics.lessons_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.test_submission_duration) {
    summary += `${indent}Test Submission Duration (p95): ${data.metrics.test_submission_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  
  summary += `\n${indent}========================================\n`;
  
  return summary;
}
