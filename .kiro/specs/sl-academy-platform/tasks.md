# Implementation Plan: SL Academy Platform

## Overview

This implementation plan breaks down the SL Academy Platform into discrete, incremental coding tasks. The platform is a B2B hospital education system with multi-tenant architecture, built using Next.js 16 (frontend), FastAPI (backend), and Supabase (PostgreSQL with RLS). The implementation follows a bottom-up approach: database schema → backend API → frontend components → integration → testing.

Each task builds on previous work and includes specific requirements references for traceability. Tasks marked with `*` are optional and can be skipped for faster MVP delivery.

## Tasks

- [x] 1. Database schema and RLS setup
  - [x] 1.1 Create core database tables and types
    - Create hospitals, profiles, tracks, lessons, questions, test_attempts, doubts, indicators tables
    - Define ENUM types: user_role, question_type, doubt_status
    - Add all constraints, indexes, and foreign keys as specified in design
    - _Requirements: 2.3, 4.1, 4.2, 4.6, 4.7, 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [x] 1.2 Implement Row Level Security (RLS) policies
    - Enable RLS on all tables
    - Create auth.user_hospital_id() helper function
    - Implement SELECT policies for hospital-level isolation
    - Implement INSERT/UPDATE policies with role checks
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 1.3 Write property test for RLS hospital isolation
    - **Property 1: Hospital Data Isolation**
    - **Property 2: RLS Policy Enforcement**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 1.4 Create database triggers and automation
    - Implement update_updated_at_column() trigger function
    - Implement handle_new_user() trigger for auto-profile creation
    - Apply triggers to relevant tables
    - _Requirements: 2.5_

- [-] 2. Backend authentication and session management
  - [x] 2.1 Set up FastAPI project structure and dependencies
    - Initialize FastAPI app with CORS middleware
    - Configure Supabase client connection
    - Set up environment variable management with pydantic-settings
    - Create project structure: routers, models, services, utils
    - _Requirements: 19.6_
  
  - [x] 2.2 Implement authentication endpoints
    - Create POST /api/auth/login endpoint with credential validation
    - Create POST /api/auth/logout endpoint
    - Implement iron-session integration for encrypted cookies
    - Set httpOnly, secure, sameSite=lax cookie attributes
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 12.1, 12.2_
  
  - [ ]* 2.3 Write property tests for session security
    - **Property 4: Session Security Attributes**
    - **Property 5: Protected Route Authentication**
    - **Validates: Requirements 1.3, 12.2, 12.3, 12.4_
  
  - [x] 2.4 Implement session validation middleware
    - Create middleware to validate session on protected routes
    - Return 401 for invalid/expired sessions
    - Implement automatic session refresh on activity
    - _Requirements: 12.3, 12.4, 12.5_
  
  - [x] 2.5 Implement rate limiting for authentication
    - Add rate limiter for login endpoint (5 attempts per 15 minutes)
    - Return 429 with retry-after header when limit exceeded
    - _Requirements: 1.6, 13.1, 13.6_
  
  - [ ]* 2.6 Write unit tests for authentication flow
    - Test successful login with valid credentials
    - Test failed login with invalid credentials
    - Test session expiration after 24 hours
    - Test rate limiting enforcement
    - _Requirements: 1.1, 1.2, 1.4, 1.6_

- [ ] 3. Backend track and lesson management
  - [x] 3.1 Create Pydantic models for tracks and lessons
    - Define Track, Lesson, LessonDetail models
    - Add validation for duration_seconds > 0
    - Add validation for order >= 0
    - _Requirements: 4.7_

  - [x] 3.2 Implement track endpoints
    - Create GET /api/tracks endpoint with hospital filtering
    - Create POST /api/tracks endpoint (manager only)
    - Create PATCH /api/tracks/{trackId} endpoint (manager only)
    - Create DELETE /api/tracks/{trackId} endpoint (soft delete, manager only)
    - _Requirements: 3.1, 3.2, 4.1, 4.3, 4.5_
  
  - [x] 3.3 Implement lesson endpoints
    - Create GET /api/tracks/{trackId}/lessons endpoint
    - Create GET /api/lessons/{lessonId} endpoint
    - Create POST /api/lessons endpoint (manager only)
    - Enforce unique ordering within track
    - Return lessons ordered by order field
    - _Requirements: 4.2, 4.4, 4.6_
  
  - [ ] 3.4 Write property tests for lesson ordering
    - **Property 20: Lesson Ordering Uniqueness**
    - **Property 21: Lesson Ordering Preservation**
    - **Validates: Requirements 4.2, 4.4**
  
  - [ ]* 3.5 Write unit tests for RBAC enforcement
    - Test manager can create/update/delete tracks
    - Test doctor cannot create/update/delete tracks (403 error)
    - Test soft delete sets deleted_at timestamp
    - _Requirements: 3.1, 3.2, 4.5_

- [x] 4. Backend test and assessment system
  - [x] 4.1 Create Pydantic models for questions and test attempts
    - Define Question, TestAttemptCreate, TestAttemptResponse models
    - Define QuestionType and validation
    - _Requirements: 6.1_
  
  - [x] 4.2 Implement test question endpoints
    - Create GET /api/lessons/{lessonId}/questions endpoint
    - Filter questions by type (pre/post)
    - Exclude correct_option_index from response (security)
    - _Requirements: 5.1, 6.6_
  
  - [ ]* 4.3 Write property test for question security
    - **Property 12: Question Security**
    - **Validates: Requirement 6.6**
  
  - [x] 4.4 Implement test scoring algorithm
    - Create calculateScore() function in Python
    - Validate all questions have answers
    - Calculate percentage of correct answers
    - Ensure score is between 0 and 100
    - _Requirements: 6.1, 6.3, 6.4_

  - [ ]* 4.5 Write property tests for test scoring
    - **Property 8: Test Score Bounds**
    - **Property 9: Test Score Calculation**
    - **Property 10: Test Answer Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x] 4.6 Implement test attempt submission endpoint
    - Create POST /api/test-attempts endpoint
    - Validate answers for all questions
    - Calculate and store score
    - Set profile_id to authenticated user
    - Return 400 for missing answers
    - _Requirements: 5.2, 5.5, 6.1, 6.2, 6.7_
  
  - [ ]* 4.7 Write property test for test ownership
    - **Property 11: Test Ownership**
    - **Validates: Requirements 3.8, 6.7**
  
  - [x] 4.8 Implement rate limiting for test submissions
    - Add rate limiter (20 submissions per hour)
    - _Requirements: 13.2_

- [x] 5. Backend doubt management system
  - [x] 5.1 Create Pydantic models for doubts
    - Define DoubtCreate, DoubtUpdate, Doubt models
    - Define DoubtStatus enum
    - Add text validation (min 10, max 5000 characters)
    - Add text sanitization to remove HTML/script tags
    - _Requirements: 7.2, 20.1, 20.2_
  
  - [x] 5.2 Implement doubt creation endpoint
    - Create POST /api/doubts endpoint
    - Set status to 'pending' by default
    - Set profile_id to authenticated user
    - Validate image URL is from Supabase Storage
    - Optionally generate AI summary
    - _Requirements: 7.1, 7.2, 7.3, 7.8_
  
  - [ ]* 5.3 Write property test for doubt initial state
    - **Property 14: Doubt Initial State**
    - **Validates: Requirement 7.1**
  
  - [x] 5.4 Implement doubt query endpoints
    - Create GET /api/doubts endpoint
    - Filter by status and lessonId (query params)
    - Return only user's doubts for doctors
    - Return all hospital doubts for managers
    - _Requirements: 7.4, 7.5_

  - [ ]* 5.5 Write property tests for doubt visibility
    - **Property 15: Doubt Ownership Filtering**
    - **Property 16: Manager Doubt Visibility**
    - **Validates: Requirements 7.4, 7.5**
  
  - [x] 5.6 Implement doubt answer endpoint
    - Create PATCH /api/doubts/{doubtId} endpoint
    - Validate user is manager (403 for doctors)
    - Update status to 'answered'
    - Set answer text and answered_by fields
    - _Requirements: 3.3, 3.4, 7.6, 7.7_
  
  - [ ]* 5.7 Write property test for doubt status invariant
    - **Property 13: Doubt Status Invariant**
    - **Validates: Requirements 7.6, 7.7**
  
  - [x] 5.8 Implement rate limiting for doubt submissions
    - Add rate limiter (10 submissions per hour)
    - _Requirements: 13.3_

- [x] 6. Backend indicator tracking system
  - [x] 6.1 Create Pydantic models for indicators
    - Define IndicatorCreate, Indicator, IndicatorImportRequest models
    - Add validation for required fields
    - _Requirements: 8.1_
  
  - [x] 6.2 Implement indicator query endpoint
    - Create GET /api/indicators endpoint
    - Filter by category, startDate, endDate (query params)
    - Return only hospital's indicators (RLS enforced)
    - _Requirements: 8.5, 8.6, 8.7_
  
  - [ ]* 6.3 Write property tests for indicator filtering
    - **Property 24: Date Range Filtering**
    - **Property 25: Category Filtering**
    - **Validates: Requirements 8.6, 8.7**
  
  - [x] 6.4 Implement indicator import algorithm
    - Create importIndicators() function
    - Validate each indicator record
    - Check for duplicates (same name + reference_date)
    - Update existing or create new
    - Return success count, error count, and error details
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 6.5 Write property test for import result consistency
    - **Property 22: Indicator Import Result Consistency**
    - **Property 23: Indicator Upsert Behavior**
    - **Validates: Requirements 8.3, 8.4**

  - [x] 6.6 Implement indicator import endpoint
    - Create POST /api/indicators/import endpoint
    - Validate user is manager (403 for doctors)
    - Call importIndicators() function
    - Return detailed error report for failed rows
    - _Requirements: 3.5, 3.6, 8.2, 23.7_
  
  - [x] 6.7 Implement rate limiting for indicator imports
    - Add rate limiter (1 import per minute)
    - _Requirements: 8.8, 13.4_

- [x] 7. Backend AI integration
  - [x] 7.1 Set up AI service client
    - Configure OpenAI or Claude API client
    - Store API key in environment variables
    - Create AIService class with retry logic
    - _Requirements: 15.5_
  
  - [x] 7.2 Implement AI recommendation generation
    - Create generateRecommendations() function
    - Analyze test performance and learning gaps
    - Return 3-5 recommended lessons with reasons
    - Implement graceful degradation on AI failure
    - _Requirements: 15.1, 15.2, 15.4_
  
  - [ ]* 7.3 Write property tests for AI recommendations
    - **Property 34: AI Recommendation Count**
    - **Property 35: AI Fallback Behavior**
    - **Validates: Requirements 15.2, 15.4**
  
  - [x] 7.4 Implement AI recommendation endpoint
    - Create POST /api/generate-recommendations endpoint
    - Validate post-test score is between 0-100
    - Call generateRecommendations() function
    - Implement timeout (3 seconds at p95)
    - _Requirements: 15.1, 15.7_
  
  - [x] 7.5 Implement AI doubt summary generation
    - Create generateDoubtSummary() function
    - Integrate with doubt creation flow
    - Handle AI service failures gracefully
    - _Requirements: 7.8, 15.3_
  
  - [x] 7.6 Implement rate limiting for AI requests
    - Add rate limiter (5 requests per hour)
    - _Requirements: 13.5_

- [x] 8. Backend file upload security
  - [x] 8.1 Implement file validation utilities
    - Create validateFileSize() function (5MB images, 10MB spreadsheets)
    - Create validateFileType() function (check magic bytes)
    - Create generateRandomFilename() function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 8.2 Write property tests for file validation
    - **Property 28: File Size Validation**
    - **Property 29: File Type Validation**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
  
  - [x] 8.3 Implement image upload endpoint
    - Create POST /api/upload/image endpoint
    - Validate file size and type
    - Generate random filename
    - Upload to Supabase Storage with RLS
    - Return signed URL
    - _Requirements: 11.1, 11.2, 11.6, 11.7, 11.8_
  
  - [x] 8.4 Implement spreadsheet upload endpoint
    - Create POST /api/upload/spreadsheet endpoint
    - Validate file size and type
    - Parse CSV/XLSX in sandboxed environment
    - Limit to 10,000 rows
    - _Requirements: 11.3, 11.4_

- [x] 9. Backend security and middleware
  - [x] 9.1 Implement security headers middleware
    - Add X-Content-Type-Options: nosniff
    - Add X-Frame-Options: DENY
    - Add X-XSS-Protection: 1; mode=block
    - Add Strict-Transport-Security header
    - Add Content-Security-Policy header
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 9.2 Write property test for security headers
    - **Property 33: Security Headers Presence**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**
  
  - [x] 9.3 Implement CORS configuration
    - Configure allowed origins
    - Set allow_credentials=True
    - Validate origin against allowlist
    - _Requirements: 19.6, 19.7_
  
  - [x] 9.4 Implement input validation and sanitization
    - Add UUID format validation
    - Add email format validation
    - Add URL format validation
    - Add numeric range validation
    - Return 400 with specific validation messages
    - _Requirements: 20.3, 20.4, 20.5, 20.6, 20.7_
  
  - [ ]* 9.5 Write property test for input validation
    - **Property 32: Input Validation Rejection**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7**

  - [x] 9.6 Implement audit logging
    - Create audit log table and model
    - Log authentication attempts
    - Log authorization failures
    - Log RLS violations
    - Log file uploads
    - Log indicator imports
    - Log cross-hospital access attempts
    - _Requirements: 2.6, 21.1, 21.2, 21.3, 21.4, 21.5, 21.7_
  
  - [ ]* 9.7 Write property test for error logging
    - **Property 36: Error Logging**
    - **Validates: Requirements 2.6, 21.1, 21.2, 21.3, 21.7**

- [x] 10. Backend error handling
  - [x] 10.1 Implement error response formatting
    - Create error handler middleware
    - Return appropriate HTTP status codes
    - Return user-friendly messages without internal details
    - Return field-level validation errors
    - _Requirements: 23.1, 23.2, 23.4_
  
  - [ ]* 10.2 Write property test for error responses
    - **Property 37: Error Response Format**
    - **Validates: Requirements 23.1, 23.2, 23.4**
  
  - [x] 10.3 Implement database retry logic
    - Add exponential backoff for connection failures
    - Retry up to 3 times
    - _Requirements: 23.5_
  
  - [x] 10.4 Implement error logging for debugging
    - Log full error details server-side
    - Include stack traces for 500 errors
    - _Requirements: 23.3_

- [x] 11. Checkpoint - Backend API complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 12. Frontend project setup and authentication
  - [x] 12.1 Initialize Next.js 16 project with TypeScript
    - Set up Next.js with App Router
    - Configure Tailwind CSS
    - Install core dependencies (React, TypeScript, Radix UI)
    - Set up project structure: app, components, lib, types
    - _Requirements: 16.1_

  - [x] 12.2 Create TypeScript types and interfaces
    - Define UserProfile, UserRole types
    - Define Track, Lesson, Question types
    - Define TestAttempt, Doubt, Indicator types
    - Create API response types
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1_
  
  - [x] 12.3 Implement authentication pages
    - Create app/login/page.tsx with login form
    - Implement form validation with Zod
    - Call POST /api/auth/login endpoint
    - Handle success (redirect) and error states
    - _Requirements: 1.1, 1.2_
  
  - [x] 12.4 Implement session management utilities
    - Create useAuth() hook for session state
    - Create getSession() server utility
    - Implement protected route wrapper
    - Redirect to login on 401 errors
    - _Requirements: 12.3, 12.4, 12.7_
  
  - [ ]* 12.5 Write unit tests for authentication components
    - Test login form validation
    - Test successful login flow
    - Test error handling
    - _Requirements: 1.1, 1.2_

- [x] 13. Frontend layout and navigation
  - [x] 13.1 Create core layout components
    - Create Sidebar component with role-based navigation
    - Create Header component with user profile
    - Create RootLayout with sidebar integration
    - _Requirements: 3.1, 3.2, 3.7_
  
  - [x] 13.2 Implement role-based UI rendering
    - Show manager-only menu items for managers
    - Show doctor-only menu items for doctors
    - Hide restricted features based on role
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 13.3 Write unit tests for role-based UI
    - Test manager sees admin menu items
    - Test doctor does not see admin menu items
    - _Requirements: 3.1, 3.2_

- [x] 14. Frontend track and lesson browsing
  - [x] 14.1 Create track listing page
    - Create app/tracks/page.tsx
    - Fetch tracks from GET /api/tracks
    - Display track cards with title, description, lesson count
    - Implement loading and error states
    - _Requirements: 4.3_

  - [x] 14.2 Create lesson listing page
    - Create app/tracks/[trackId]/page.tsx
    - Fetch lessons from GET /api/tracks/{trackId}/lessons
    - Display lessons ordered by order field
    - Show lesson duration and completion status
    - _Requirements: 4.4_
  
  - [x] 14.3 Create lesson detail page
    - Create app/lessons/[lessonId]/page.tsx
    - Fetch lesson from GET /api/lessons/{lessonId}
    - Display lesson title, description, track info
    - Integrate video player and test components
    - _Requirements: 5.1_
  
  - [ ]* 14.4 Write unit tests for track/lesson components
    - Test track listing renders correctly
    - Test lesson ordering is preserved
    - Test loading and error states
    - _Requirements: 4.3, 4.4_

- [x] 15. Frontend video player and progress tracking
  - [x] 15.1 Create VideoPlayer component
    - Integrate react-player library
    - Track playback progress with onProgress callback
    - Save progress to localStorage
    - Restore saved position on load
    - Trigger onComplete callback when video ends
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 15.2 Write property tests for video progress
    - **Property 26: Video Progress Round Trip**
    - **Property 27: Video Completion Callback**
    - **Validates: Requirements 10.2, 10.3, 10.4**
  
  - [x] 15.3 Implement video error handling
    - Display error message on video load failure
    - Provide retry button
    - Log error with video URL and user context
    - _Requirements: 10.5, 10.7_
  
  - [x] 15.4 Implement video quality selection
    - Add quality selector (360p, 480p, 720p)
    - Implement adaptive bitrate streaming support
    - Show buffering indicator
    - _Requirements: 25.6, 25.7_
  
  - [ ]* 15.5 Write unit tests for video player
    - Test progress tracking
    - Test completion callback
    - Test error handling
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 16. Frontend test and assessment UI
  - [x] 16.1 Create TestForm component
    - Display questions with multiple choice options
    - Track selected answers in state
    - Validate all questions are answered before submission
    - Show validation errors
    - _Requirements: 6.1, 6.2_

  - [x] 16.2 Implement test submission flow
    - Fetch questions from GET /api/lessons/{lessonId}/questions
    - Submit answers to POST /api/test-attempts
    - Display score and feedback
    - Handle submission errors
    - _Requirements: 5.2, 5.5, 6.1_
  
  - [x] 16.3 Implement learning workflow orchestration
    - Enforce pre-test → video → post-test sequence
    - Disable video until pre-test is complete
    - Disable post-test until video is complete
    - Calculate and display improvement score
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 16.4 Implement AI recommendations display
    - Trigger recommendation generation on low improvement
    - Display 3-5 recommended lessons with reasons
    - Handle AI service unavailability gracefully
    - _Requirements: 5.7, 15.1, 15.2, 15.4_
  
  - [ ]* 16.5 Write unit tests for test components
    - Test form validation prevents incomplete submission
    - Test score display after submission
    - Test learning workflow sequence enforcement
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [x] 17. Frontend doubt management UI
  - [x] 17.1 Create DoubtForm component
    - Create form with text input and image upload
    - Validate text length (10-5000 characters)
    - Integrate image upload to POST /api/upload/image
    - Submit doubt to POST /api/doubts
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 17.2 Create DoubtCard component
    - Display doubt text, image, status, answer
    - Show different views for doctor vs manager
    - Include answer form for managers
    - _Requirements: 7.4, 7.5, 7.6_
  
  - [x] 17.3 Create doubt listing page for doctors
    - Create app/doubts/page.tsx
    - Fetch doubts from GET /api/doubts
    - Display only user's doubts
    - Filter by status (pending/answered)
    - _Requirements: 7.4_
  
  - [x] 17.4 Create Kanban board for managers
    - Create app/manager/doubts/page.tsx
    - Implement drag-and-drop with @dnd-kit
    - Show pending and answered columns
    - Fetch all hospital doubts from GET /api/doubts
    - _Requirements: 7.5_

  - [x] 17.5 Implement doubt answer functionality
    - Add answer form to DoubtCard for managers
    - Submit answer to PATCH /api/doubts/{doubtId}
    - Update UI to show answered status
    - Display AI summary if available
    - _Requirements: 7.6, 7.7, 7.8_
  
  - [ ]* 17.6 Write unit tests for doubt components
    - Test doubt form validation
    - Test doctor sees only their doubts
    - Test manager can answer doubts
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6_

- [x] 18. Frontend indicator tracking and dashboard
  - [x] 18.1 Create indicator import page
    - Create app/manager/indicators/import/page.tsx
    - Implement CSV/XLSX file upload with react-dropzone
    - Parse file with papaparse
    - Submit to POST /api/indicators/import
    - Display success/error summary with row details
    - _Requirements: 8.1, 8.2, 8.4, 23.7_
  
  - [x] 18.2 Create indicator chart components
    - Create LineChart component with recharts
    - Create BarChart component for category comparison
    - Implement date range filtering
    - Implement category filtering
    - _Requirements: 8.6, 8.7, 9.1_
  
  - [x] 18.3 Create manager dashboard page
    - Create app/manager/dashboard/page.tsx
    - Fetch indicators from GET /api/indicators
    - Display indicator trends over time
    - Display test score distributions
    - Display lesson completion rates by track
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 18.4 Implement dashboard data aggregation
    - Aggregate test attempts by lesson and time period
    - Calculate average pre-test and post-test scores
    - Calculate average improvement scores
    - _Requirements: 9.5, 9.6, 9.7_
  
  - [ ]* 18.5 Write unit tests for dashboard components
    - Test indicator chart rendering
    - Test date range filtering
    - Test category filtering
    - Test data aggregation calculations
    - _Requirements: 8.6, 8.7, 9.5, 9.6, 9.7_

- [x] 19. Frontend file upload and validation
  - [x] 19.1 Create file upload utilities
    - Implement client-side file size validation
    - Implement client-side file type validation
    - Create upload progress indicator
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 19.2 Create ImageUpload component
    - Integrate react-dropzone
    - Validate file size (5MB max)
    - Validate file type (JPEG, PNG, WebP)
    - Upload to POST /api/upload/image
    - Display preview and upload progress
    - _Requirements: 11.1, 11.2_
  
  - [x] 19.3 Create SpreadsheetUpload component
    - Integrate react-dropzone
    - Validate file size (10MB max)
    - Validate file type (CSV, XLSX)
    - Parse and preview data before submission
    - _Requirements: 11.3, 11.4_
  
  - [ ]* 19.4 Write unit tests for file upload components
    - Test file size validation
    - Test file type validation
    - Test upload error handling
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 20. Frontend manager-only features
  - [x] 20.1 Create track management page
    - Create app/manager/tracks/page.tsx
    - Display track list with edit/delete actions
    - Implement create track form
    - Implement edit track form
    - Implement soft delete with confirmation
    - _Requirements: 3.1, 4.1, 4.5_
  
  - [x] 20.2 Create lesson management page
    - Create app/manager/tracks/[trackId]/lessons/page.tsx
    - Display lesson list with reordering capability
    - Implement create lesson form
    - Implement edit lesson form
    - Enforce unique ordering within track
    - _Requirements: 3.1, 4.2, 4.6_
  
  - [x] 20.3 Create user management page (future)
    - Create app/manager/users/page.tsx
    - Display user list with role badges
    - Implement create user form
    - Implement focal point designation
    - _Requirements: 3.1, 24.1, 24.4_
  
  - [ ]* 20.4 Write unit tests for manager features
    - Test only managers can access management pages
    - Test track creation and editing
    - Test lesson ordering enforcement
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [x] 21. Frontend focal point doctor features
  - [x] 21.1 Implement support materials display
    - Add support materials section to lesson detail page
    - Show only for focal point doctors
    - Hide for non-focal-point doctors
    - _Requirements: 24.2, 24.3_

  - [ ]* 21.2 Write property test for focal point validation
    - **Property 38: Focal Point Validation**
    - **Validates: Requirement 24.4**
  
  - [ ]* 21.3 Write unit tests for focal point features
    - Test focal point doctor sees support materials
    - Test non-focal-point doctor does not see support materials
    - _Requirements: 24.2, 24.3_

- [x] 22. Frontend PWA implementation
  - [x] 22.1 Configure PWA with next-pwa
    - Install and configure next-pwa
    - Create manifest.json with app metadata
    - Add app icons and splash screens
    - _Requirements: 16.1, 16.2_
  
  - [x] 22.2 Implement service worker for offline caching
    - Cache static assets (CSS, JS, images)
    - Cache API responses with stale-while-revalidate
    - Cache video metadata for offline viewing
    - _Requirements: 16.3, 16.6, 16.7_
  
  - [x] 22.3 Implement offline indicator
    - Detect online/offline status
    - Display offline banner when disconnected
    - Queue actions for sync when reconnected
    - _Requirements: 16.4, 16.5_
  
  - [ ]* 22.4 Write unit tests for PWA features
    - Test offline detection
    - Test service worker caching
    - Test action queuing and sync
    - _Requirements: 16.3, 16.4, 16.5_

- [x] 23. Frontend performance optimization
  - [x] 23.1 Implement code splitting and lazy loading
    - Lazy load video player component
    - Lazy load chart components
    - Implement route-based code splitting
    - _Requirements: 17.5_
  
  - [x] 23.2 Implement data fetching optimization
    - Use SWR for API calls with caching
    - Implement pagination for list endpoints (20 items per page)
    - Preload next lesson metadata
    - _Requirements: 18.6_
  
  - [x] 23.3 Optimize images and assets
    - Use Next.js Image component for optimization
    - Implement lazy loading for images
    - Compress and optimize static assets
    - _Requirements: 17.5, 17.6_

  - [x] 23.4 Measure and optimize Core Web Vitals
    - Achieve Time to Interactive < 3s on 3G
    - Achieve First Contentful Paint < 1.5s
    - Achieve Largest Contentful Paint < 2.5s
    - Achieve Cumulative Layout Shift < 0.1
    - _Requirements: 17.5, 17.6, 17.7, 17.8_

- [x] 24. Frontend error handling and user feedback
  - [x] 24.1 Create error boundary components
    - Implement global error boundary
    - Implement route-specific error boundaries
    - Display user-friendly error messages
    - Provide recovery options (retry, go back)
    - _Requirements: 23.1, 23.4_
  
  - [x] 24.2 Implement form validation feedback
    - Display field-level validation errors
    - Show inline error messages
    - Highlight invalid fields
    - _Requirements: 23.2_
  
  - [x] 24.3 Implement loading states
    - Add loading spinners for async operations
    - Add skeleton loaders for content
    - Disable buttons during submission
    - _Requirements: 23.1_
  
  - [x] 24.4 Implement toast notifications
    - Create toast component for success/error messages
    - Show toast on successful operations
    - Show toast on errors with retry option
    - _Requirements: 23.1, 23.4_
  
  - [ ]* 24.5 Write unit tests for error handling
    - Test error boundary catches errors
    - Test form validation displays errors
    - Test loading states render correctly
    - _Requirements: 23.1, 23.2_

- [ ] 25. Checkpoint - Frontend complete
  - Ensure all frontend tests pass, ask the user if questions arise.

- [ ] 26. Integration and end-to-end testing
  - [ ] 26.1 Set up Playwright for E2E testing
    - Install and configure Playwright
    - Create test fixtures for authentication
    - Set up test database seeding
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 26.2 Write E2E test for doctor learning journey
    - Test login as doctor
    - Test browse tracks and select lesson
    - Test complete pre-test
    - Test watch video
    - Test complete post-test
    - Test submit doubt
    - Test verify scores and recommendations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1_

  - [ ]* 26.3 Write E2E test for manager dashboard journey
    - Test login as manager
    - Test view indicator dashboard
    - Test import indicators from CSV
    - Test view doubt kanban board
    - Test answer pending doubt
    - _Requirements: 8.1, 8.2, 9.1, 7.5, 7.6_
  
  - [ ]* 26.4 Write E2E test for multi-tenant isolation
    - Test create two hospitals with users
    - Test login as Hospital A user
    - Test attempt to access Hospital B data via direct URL
    - Test verify 403 error and no data leakage
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 26.5 Write E2E test for session management
    - Test login successfully
    - Test perform authenticated actions
    - Test session expiration behavior
    - Test re-authentication and return to previous page
    - _Requirements: 1.4, 12.4, 12.7_

- [ ] 27. Soft delete implementation and testing
  - [x] 27.1 Implement soft delete for all entities
    - Ensure all delete operations set deleted_at timestamp
    - Ensure all queries filter out soft-deleted records
    - Implement permanent purge for records older than 90 days
    - _Requirements: 14.1, 14.2, 14.6_
  
  - [ ]* 27.2 Write property tests for soft delete
    - **Property 17: Soft Delete Marking**
    - **Property 18: Soft Delete Filtering**
    - **Property 19: Foreign Key Validity with Soft Deletes**
    - **Validates: Requirements 4.5, 4.6, 14.1, 14.2, 14.3, 14.4, 14.5**

- [ ] 28. Data privacy and compliance features
  - [x] 28.1 Implement user data export
    - Create GET /api/users/me/export endpoint
    - Export all user's personal data in JSON format
    - Include test attempts, doubts, video history
    - _Requirements: 27.3_
  
  - [ ]* 28.2 Write property test for data export completeness
    - **Property 39: Data Export Completeness**
    - **Validates: Requirement 27.3**
  
  - [x] 28.3 Implement user data deletion
    - Create DELETE /api/users/me endpoint
    - Permanently remove all user's personal data
    - Anonymize video watch history
    - _Requirements: 27.4, 27.7_
  
  - [ ]* 28.4 Write property test for data deletion completeness
    - **Property 40: Data Deletion Completeness**
    - **Validates: Requirement 27.4**
  
  - [x] 28.5 Implement consent management
    - Create privacy policy and terms of service pages
    - Add consent checkbox to registration
    - Store consent timestamp
    - _Requirements: 27.1, 27.2, 27.6_

- [ ] 29. Deployment and infrastructure
  - [x] 29.1 Set up environment configuration
    - Create .env.example with all required variables
    - Document environment variable requirements
    - Set up separate configs for dev, staging, production
    - _Requirements: 12.1_
  
  - [x] 29.2 Configure database migrations
    - Set up Supabase migration scripts
    - Create initial migration with all tables and RLS
    - Test migration rollback procedures
    - _Requirements: 2.3_
  
  - [x] 29.3 Set up CI/CD pipeline
    - Configure GitHub Actions for automated testing
    - Run unit tests on pull requests
    - Run E2E tests on staging deployment
    - Automate deployment to production
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [x] 29.4 Configure monitoring and alerting
    - Set up error tracking (Sentry or similar)
    - Configure performance monitoring
    - Set up alerts for API p95 > 1000ms
    - Set up alerts for error rate > 5%
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 29.5 Set up backup and recovery procedures
    - Configure automated daily backups
    - Set up 30-day backup retention
    - Test restore procedures
    - Document recovery process
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [ ] 30. Security hardening and penetration testing
  - [x] 30.1 Implement secrets management
    - Move all secrets to secure vault
    - Set up secret rotation schedule
    - Document secret rotation procedures
    - _Requirements: 12.1_
  
  - [x] 30.2 Conduct security audit
    - Review all RLS policies for gaps
    - Test for SQL injection vulnerabilities
    - Test for XSS vulnerabilities
    - Test for CSRF vulnerabilities
    - _Requirements: 2.1, 2.2, 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 30.3 Write property tests for automatic hospital assignment
    - **Property 3: Automatic Hospital Assignment**
    - **Validates: Requirements 2.5, 4.1**
  
  - [ ]* 30.4 Write property tests for RBAC enforcement
    - **Property 6: Manager Permission Enforcement**
    - **Property 7: Doctor Permission Restrictions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
  
  - [ ]* 30.5 Write property tests for file storage isolation
    - **Property 30: File Storage Isolation**
    - **Property 31: Secure File Access**
    - **Validates: Requirements 11.7, 11.8**

- [ ] 31. Performance testing and optimization
  - [ ] 31.1 Conduct load testing
    - Test API endpoints under load (1000 req/min)
    - Measure response times at p50, p95, p99
    - Identify bottlenecks
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [ ] 31.2 Optimize slow queries
    - Review query execution plans
    - Add missing indexes
    - Optimize N+1 query problems
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.7_
  
  - [ ] 31.3 Implement caching strategy
    - Cache track and lesson listings (5-10 min TTL)
    - Cache user profiles (15 min TTL)
    - Implement cache invalidation on updates
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ] 31.4 Optimize video delivery
    - Configure CDN for video files
    - Implement adaptive bitrate streaming
    - Set up video preloading strategy
    - _Requirements: 25.1, 25.2, 25.4, 25.5_

- [ ] 32. Documentation and handoff
  - [ ] 32.1 Write API documentation
    - Document all endpoints with request/response examples
    - Document authentication flow
    - Document error codes and messages
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ] 32.2 Write deployment documentation
    - Document infrastructure requirements
    - Document environment setup
    - Document deployment procedures
    - Document rollback procedures
    - _Requirements: 29.1, 29.2_
  
  - [ ] 32.3 Write user documentation
    - Create user guide for doctors
    - Create admin guide for managers
    - Document common troubleshooting steps
    - _Requirements: 23.1, 23.4_
  
  - [ ] 32.4 Create runbook for operations
    - Document monitoring and alerting
    - Document incident response procedures
    - Document backup and recovery procedures
    - Document secret rotation procedures
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [ ] 33. Final checkpoint - System complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Checkpoints ensure incremental validation at major milestones
- The implementation follows a bottom-up approach: database → backend → frontend → integration
- All code should be production-ready with proper error handling and security measures
- Performance requirements should be validated throughout implementation
- Multi-tenant isolation must be tested thoroughly to prevent data leakage
