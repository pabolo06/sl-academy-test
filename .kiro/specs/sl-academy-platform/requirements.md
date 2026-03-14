# Requirements Document: SL Academy Platform

## Introduction

SL Academy is a B2B hospital education and management platform that combines microlearning with indicator tracking to improve protocol adherence and patient safety. The system serves doctors who consume short educational content (5-15 minute lessons) and take assessments, and managers/directors who monitor training effectiveness through dashboards and manage hospital indicators. The platform uses a multi-tenant architecture with strict hospital-level data isolation, integrating video-based learning, knowledge assessments, doubt management, and performance analytics into a unified Progressive Web Application (PWA) experience.

## Glossary

- **System**: The SL Academy Platform (frontend and backend)
- **Doctor**: A medical professional user who consumes lessons and takes assessments
- **Manager**: A hospital administrator who monitors training and manages indicators
- **Focal_Point_Doctor**: A doctor designated to access specialized support materials for in-person training
- **Hospital**: A tenant organization in the multi-tenant system
- **Track**: A collection of related lessons organized by topic
- **Lesson**: A single educational unit containing a video and assessments
- **Pre_Test**: An assessment taken before watching a lesson video
- **Post_Test**: An assessment taken after watching a lesson video
- **Doubt**: A question submitted by a doctor about lesson content
- **Indicator**: A hospital safety or performance metric tracked over time
- **RLS**: Row Level Security - database-level access control mechanism
- **Session**: An authenticated user's encrypted connection to the system
- **Test_Attempt**: A record of a user's answers and score for a test
- **Soft_Delete**: Marking a record as deleted without physically removing it from the database

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely log in to the platform, so that I can access my hospital's educational content and data.

#### Acceptance Criteria

1. WHEN a user provides valid email and password credentials, THE System SHALL create an encrypted session and return a user profile
2. WHEN a user provides invalid credentials, THE System SHALL reject the login attempt and return an error message
3. WHEN a session is created, THE System SHALL set an httpOnly secure cookie with the session token
4. WHEN a user's session exceeds 24 hours of inactivity, THE System SHALL expire the session
5. WHEN a user logs out, THE System SHALL destroy the session and clear the session cookie
6. WHEN a user attempts more than 5 failed login attempts within 15 minutes, THE System SHALL temporarily lock the account

### Requirement 2: Multi-Tenant Data Isolation

**User Story:** As a hospital administrator, I want complete data isolation between hospitals, so that our sensitive training and performance data remains private.

#### Acceptance Criteria

1. WHEN a user queries any data, THE System SHALL automatically filter results to include only records belonging to the user's hospital
2. WHEN a user attempts to access data from a different hospital, THE System SHALL deny access and return a 403 error
3. FOR ALL database tables with hospital-scoped data, THE System SHALL enforce Row Level Security policies
4. WHEN a database query executes, THE RLS SHALL derive the hospital_id from the authenticated user context
5. WHEN a user creates new data, THE System SHALL automatically set the hospital_id to the user's hospital
6. WHEN a cross-hospital access attempt occurs, THE System SHALL log the security event for audit purposes

### Requirement 3: Role-Based Access Control

**User Story:** As a system administrator, I want different user roles to have appropriate permissions, so that managers can administer content while doctors can consume it.

#### Acceptance Criteria

1. WHEN a manager attempts to create, update, or delete tracks, THE System SHALL allow the operation
2. WHEN a doctor attempts to create, update, or delete tracks, THE System SHALL deny the operation with a 403 error
3. WHEN a manager attempts to answer doubts, THE System SHALL allow the operation
4. WHEN a doctor attempts to answer doubts, THE System SHALL deny the operation with a 403 error
5. WHEN a manager attempts to import indicators, THE System SHALL allow the operation
6. WHEN a doctor attempts to import indicators, THE System SHALL deny the operation with a 403 error
7. WHEN any authenticated user requests tracks and lessons, THE System SHALL allow read access
8. WHEN a doctor creates a test attempt, THE System SHALL allow the operation only for their own profile

### Requirement 4: Track and Lesson Management

**User Story:** As a manager, I want to organize educational content into tracks and lessons, so that doctors can follow structured learning paths.

#### Acceptance Criteria

1. WHEN a manager creates a track, THE System SHALL store it with the manager's hospital_id
2. WHEN a manager creates a lesson within a track, THE System SHALL enforce unique ordering within that track
3. WHEN a user requests tracks, THE System SHALL return only non-deleted tracks from the user's hospital
4. WHEN a user requests lessons for a track, THE System SHALL return lessons ordered by the order field
5. WHEN a manager soft-deletes a track, THE System SHALL set the deleted_at timestamp and exclude it from future queries
6. WHEN a lesson is created, THE System SHALL validate that the track_id references an existing non-deleted track
7. WHEN a lesson is created, THE System SHALL validate that duration_seconds is greater than zero

### Requirement 5: Learning Workflow Execution

**User Story:** As a doctor, I want to complete a structured learning workflow with pre-test, video, and post-test, so that I can learn effectively and demonstrate knowledge improvement.

#### Acceptance Criteria

1. WHEN a doctor accesses a lesson, THE System SHALL provide pre-test questions before allowing video access
2. WHEN a doctor submits a pre-test, THE System SHALL calculate and store the score
3. WHEN a doctor watches a lesson video, THE System SHALL track playback progress
4. WHEN a doctor completes watching a video, THE System SHALL enable the post-test
5. WHEN a doctor submits a post-test, THE System SHALL calculate and store the score
6. WHEN both pre-test and post-test are completed, THE System SHALL calculate the improvement score
7. IF the improvement score is below a threshold, THEN THE System SHALL generate AI-powered recommendations

### Requirement 6: Test Scoring and Validation

**User Story:** As a doctor, I want my test answers to be accurately scored, so that my knowledge level is correctly assessed.

#### Acceptance Criteria

1. WHEN a test is submitted, THE System SHALL validate that answers are provided for all questions
2. WHEN a test is submitted with missing answers, THE System SHALL reject the submission with a 400 error
3. WHEN calculating a test score, THE System SHALL compute the percentage of correct answers
4. THE System SHALL ensure all test scores are between 0 and 100 inclusive
5. WHEN a test is submitted, THE System SHALL store the answers, score, and completion timestamp
6. WHEN fetching questions for a test, THE System SHALL not include the correct answer index in the response
7. WHEN a test attempt is created, THE System SHALL set the profile_id to the authenticated user's ID

### Requirement 7: Doubt Management

**User Story:** As a doctor, I want to submit questions about lesson content with optional images, so that I can get clarification from managers.

#### Acceptance Criteria

1. WHEN a doctor submits a doubt, THE System SHALL create it with status 'pending'
2. WHEN a doctor submits a doubt, THE System SHALL validate that the text is at least 10 characters long
3. WHEN a doctor submits a doubt with an image, THE System SHALL validate the image URL is from Supabase Storage
4. WHEN a doctor requests their doubts, THE System SHALL return only doubts created by that doctor
5. WHEN a manager requests doubts, THE System SHALL return all doubts from the manager's hospital
6. WHEN a manager answers a doubt, THE System SHALL update the status to 'answered' and record the answerer's ID
7. WHEN a doubt status is 'answered', THE System SHALL ensure both answer text and answered_by fields are populated
8. WHEN a doubt is created, THE System SHALL optionally generate an AI summary of the question

### Requirement 8: Indicator Tracking and Import

**User Story:** As a manager, I want to import and track hospital safety indicators, so that I can correlate training effectiveness with patient outcomes.

#### Acceptance Criteria

1. WHEN a manager imports indicators, THE System SHALL validate each indicator has name, value, category, and reference_date
2. WHEN an indicator import contains invalid data, THE System SHALL log the error and continue processing valid records
3. WHEN an indicator with the same name and reference_date exists, THE System SHALL update the existing record
4. WHEN an indicator import completes, THE System SHALL return success count, error count, and error details
5. WHEN a manager queries indicators, THE System SHALL return only indicators from the manager's hospital
6. WHEN indicators are queried with date range filters, THE System SHALL return only indicators within that range
7. WHEN indicators are queried with category filter, THE System SHALL return only indicators matching that category
8. WHEN a manager imports indicators, THE System SHALL enforce a rate limit of 1 import per minute

### Requirement 9: Dashboard and Analytics

**User Story:** As a manager, I want to view training completion rates and test scores alongside hospital indicators, so that I can assess training impact on safety metrics.

#### Acceptance Criteria

1. WHEN a manager accesses the dashboard, THE System SHALL display indicator trends over time
2. WHEN a manager accesses the dashboard, THE System SHALL display test score distributions
3. WHEN a manager accesses the dashboard, THE System SHALL display lesson completion rates by track
4. WHEN a manager accesses the dashboard, THE System SHALL display only data from the manager's hospital
5. WHEN dashboard data is requested, THE System SHALL aggregate test attempts by lesson and time period
6. WHEN dashboard data is requested, THE System SHALL calculate average pre-test and post-test scores
7. WHEN dashboard data is requested, THE System SHALL calculate average improvement scores

### Requirement 10: Video Playback and Progress Tracking

**User Story:** As a doctor, I want to watch lesson videos with progress tracking, so that I can resume where I left off and the system knows when I've completed viewing.

#### Acceptance Criteria

1. WHEN a doctor starts watching a video, THE System SHALL track the current playback time
2. WHEN a doctor pauses or stops a video, THE System SHALL save the current progress
3. WHEN a doctor returns to a partially watched video, THE System SHALL resume from the saved position
4. WHEN a video playback reaches the end, THE System SHALL trigger the completion callback
5. WHEN a video fails to load, THE System SHALL display an error message and provide a retry option
6. WHEN a video is playing, THE System SHALL update progress at regular intervals
7. WHEN a video URL is inaccessible, THE System SHALL log the error with video URL and user context

### Requirement 11: File Upload Security

**User Story:** As a system administrator, I want file uploads to be validated and secured, so that malicious files cannot compromise the system.

#### Acceptance Criteria

1. WHEN a user uploads an image for a doubt, THE System SHALL validate the file size is 5MB or less
2. WHEN a user uploads an image, THE System SHALL validate the file type is JPEG, PNG, or WebP
3. WHEN a user uploads a spreadsheet for indicators, THE System SHALL validate the file size is 10MB or less
4. WHEN a user uploads a spreadsheet, THE System SHALL validate the file type is CSV or XLSX
5. WHEN a file is uploaded, THE System SHALL validate the file type by magic bytes, not just extension
6. WHEN a file is uploaded, THE System SHALL generate a random filename to prevent path traversal attacks
7. WHEN a file is stored, THE System SHALL apply RLS policies to ensure hospital-level isolation
8. WHEN a file is accessed, THE System SHALL serve it via a signed URL with expiration

### Requirement 12: Session Management and Security

**User Story:** As a user, I want my session to be secure and automatically managed, so that my account is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a session is created, THE System SHALL encrypt it using AES-256-GCM
2. WHEN a session cookie is set, THE System SHALL use httpOnly, secure, and sameSite=lax attributes
3. WHEN a user makes a request to a protected route, THE System SHALL validate the session cookie
4. WHEN a session is invalid or expired, THE System SHALL return a 401 error and redirect to login
5. WHEN a user is active, THE System SHALL automatically refresh the session
6. WHEN a session expires, THE System SHALL clear all session data
7. WHEN a user re-authenticates after expiration, THE System SHALL return them to their previous page

### Requirement 13: API Rate Limiting

**User Story:** As a system administrator, I want API endpoints to be rate-limited, so that the system is protected from abuse and denial-of-service attacks.

#### Acceptance Criteria

1. WHEN a user attempts more than 5 login requests within 15 minutes, THE System SHALL reject subsequent requests
2. WHEN a user attempts more than 20 test submissions within 1 hour, THE System SHALL reject subsequent requests
3. WHEN a user attempts more than 10 doubt submissions within 1 hour, THE System SHALL reject subsequent requests
4. WHEN a user attempts more than 1 indicator import within 1 minute, THE System SHALL reject subsequent requests
5. WHEN a user attempts more than 5 AI recommendation requests within 1 hour, THE System SHALL reject subsequent requests
6. WHEN a rate limit is exceeded, THE System SHALL return a 429 error with retry-after header

### Requirement 14: Soft Delete Consistency

**User Story:** As a system administrator, I want deleted records to be hidden but preserved, so that data can be recovered if needed while remaining invisible to users.

#### Acceptance Criteria

1. WHEN a record is soft-deleted, THE System SHALL set the deleted_at timestamp
2. WHEN a query executes, THE System SHALL exclude all records where deleted_at is not null
3. WHEN a soft-deleted record is referenced by foreign key, THE System SHALL treat it as non-existent
4. WHEN a user attempts to access a soft-deleted record, THE System SHALL return a 404 error
5. THE System SHALL apply soft-delete filtering to all user-facing queries
6. WHEN a soft-deleted record is older than 90 days, THE System SHALL permanently purge it

### Requirement 15: AI-Powered Features

**User Story:** As a doctor, I want AI-generated recommendations and doubt summaries, so that I can get personalized learning guidance and quick doubt overviews.

#### Acceptance Criteria

1. WHEN a doctor's post-test score is below the improvement threshold, THE System SHALL generate personalized lesson recommendations
2. WHEN AI recommendations are generated, THE System SHALL return 3-5 recommended lessons with reasons
3. WHEN a doubt is created, THE System SHALL optionally generate an AI summary of the question text
4. WHEN the AI service is unavailable, THE System SHALL gracefully degrade and provide manual recommendations
5. WHEN an AI API call fails, THE System SHALL retry with exponential backoff up to 3 attempts
6. WHEN AI service failures persist, THE System SHALL log an alert for administrators
7. WHEN AI recommendations are generated, THE System SHALL complete within 3 seconds at p95

### Requirement 16: Progressive Web App (PWA) Support

**User Story:** As a doctor, I want to install the platform as a PWA on my mobile device, so that I can access training content offline and with a native app experience.

#### Acceptance Criteria

1. WHEN a user visits the platform on a mobile browser, THE System SHALL offer PWA installation
2. WHEN the PWA is installed, THE System SHALL provide an app icon and splash screen
3. WHEN the PWA is offline, THE System SHALL cache previously viewed content for access
4. WHEN the PWA is offline, THE System SHALL display a clear offline indicator
5. WHEN the PWA regains connectivity, THE System SHALL sync any pending actions
6. THE System SHALL implement a service worker for offline caching
7. THE System SHALL cache video metadata and lesson content for offline viewing

### Requirement 17: Performance Requirements

**User Story:** As a user, I want the platform to load quickly and respond promptly, so that I can efficiently complete my training tasks.

#### Acceptance Criteria

1. WHEN a user authenticates, THE System SHALL respond within 200ms at p95
2. WHEN a user requests track or lesson listings, THE System SHALL respond within 300ms at p95
3. WHEN a user submits a test, THE System SHALL respond within 500ms at p95
4. WHEN a user queries indicators, THE System SHALL respond within 400ms at p95
5. WHEN the frontend loads, THE System SHALL achieve Time to Interactive under 3 seconds on 3G
6. WHEN the frontend loads, THE System SHALL achieve First Contentful Paint under 1.5 seconds
7. WHEN the frontend loads, THE System SHALL achieve Largest Contentful Paint under 2.5 seconds
8. WHEN the frontend renders, THE System SHALL maintain Cumulative Layout Shift under 0.1

### Requirement 18: Database Indexing and Optimization

**User Story:** As a system administrator, I want database queries to be optimized with proper indexing, so that the platform remains performant as data grows.

#### Acceptance Criteria

1. THE System SHALL maintain an index on profiles(hospital_id, role) for non-deleted records
2. THE System SHALL maintain an index on test_attempts(profile_id, completed_at) in descending order
3. THE System SHALL maintain an index on doubts(status, created_at) for non-deleted records
4. THE System SHALL maintain an index on indicators(hospital_id, reference_date) for non-deleted records
5. THE System SHALL maintain an index on lessons(track_id, order) for non-deleted records
6. WHEN querying lists, THE System SHALL implement pagination with a default of 20 items per page
7. WHEN querying data, THE System SHALL select specific columns rather than using SELECT *

### Requirement 19: Security Headers and CORS

**User Story:** As a system administrator, I want proper security headers and CORS configuration, so that the platform is protected from common web vulnerabilities.

#### Acceptance Criteria

1. WHEN the System responds to any request, THE System SHALL include X-Content-Type-Options: nosniff header
2. WHEN the System responds to any request, THE System SHALL include X-Frame-Options: DENY header
3. WHEN the System responds to any request, THE System SHALL include X-XSS-Protection: 1; mode=block header
4. WHEN the System responds to any request, THE System SHALL include Strict-Transport-Security header
5. WHEN the System responds to any request, THE System SHALL include Content-Security-Policy header
6. WHEN a cross-origin request is made, THE System SHALL validate the origin against the allowlist
7. WHEN a cross-origin request is from an unauthorized origin, THE System SHALL reject it

### Requirement 20: Input Validation and Sanitization

**User Story:** As a system administrator, I want all user input to be validated and sanitized, so that the system is protected from injection attacks and malformed data.

#### Acceptance Criteria

1. WHEN a user submits doubt text, THE System SHALL validate it is between 10 and 5000 characters
2. WHEN a user submits doubt text, THE System SHALL sanitize it to remove HTML and script tags
3. WHEN a user submits a UUID parameter, THE System SHALL validate it matches UUID format
4. WHEN a user submits an email, THE System SHALL validate it matches email format
5. WHEN a user submits a URL, THE System SHALL validate it is a properly formatted HTTP/HTTPS URL
6. WHEN a user submits numeric data, THE System SHALL validate it is within acceptable ranges
7. WHEN validation fails, THE System SHALL return a 400 error with specific validation messages

### Requirement 21: Audit Logging

**User Story:** As a system administrator, I want security-relevant events to be logged, so that I can audit system access and detect suspicious activity.

#### Acceptance Criteria

1. WHEN a user attempts authentication, THE System SHALL log the attempt with timestamp, user ID, and result
2. WHEN an authorization failure occurs, THE System SHALL log the event with user ID, resource, and reason
3. WHEN an RLS policy violation occurs, THE System SHALL log the event with user ID and attempted access
4. WHEN a file is uploaded, THE System SHALL log the event with user ID, file type, and size
5. WHEN indicators are imported, THE System SHALL log the event with user ID, source, and record count
6. WHEN a password reset is requested, THE System SHALL log the event with user ID and timestamp
7. WHEN a cross-hospital access attempt occurs, THE System SHALL log the security event with full context

### Requirement 22: Data Backup and Recovery

**User Story:** As a system administrator, I want automated backups and tested recovery procedures, so that data can be restored in case of failure or data loss.

#### Acceptance Criteria

1. THE System SHALL perform automated daily backups of the database
2. THE System SHALL retain backups for 30 days
3. THE System SHALL encrypt backups at rest
4. THE System SHALL store backups in a separate geographic region from the primary database
5. WHEN a backup is created, THE System SHALL verify its integrity
6. THE System SHALL test restore procedures quarterly
7. WHEN soft-deleted records exceed 90 days old, THE System SHALL permanently purge them from backups

### Requirement 23: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and recovery options when something goes wrong, so that I can understand the issue and take appropriate action.

#### Acceptance Criteria

1. WHEN an error occurs, THE System SHALL return an appropriate HTTP status code
2. WHEN a validation error occurs, THE System SHALL return specific field-level error messages
3. WHEN a server error occurs, THE System SHALL log the full error details for debugging
4. WHEN a server error occurs, THE System SHALL return a user-friendly message without exposing internals
5. WHEN a database connection fails, THE System SHALL retry up to 3 times with exponential backoff
6. WHEN a video fails to load, THE System SHALL provide a retry button and option to report the issue
7. WHEN an indicator import has errors, THE System SHALL provide a downloadable error report with row numbers

### Requirement 24: Focal Point Doctor Features

**User Story:** As a focal point doctor, I want access to specialized support materials, so that I can conduct effective in-person training sessions.

#### Acceptance Criteria

1. WHEN a focal point doctor is designated, THE System SHALL set the is_focal_point flag to true
2. WHEN a focal point doctor accesses lessons, THE System SHALL display additional support materials
3. WHEN a non-focal-point doctor accesses lessons, THE System SHALL hide support materials
4. WHEN a manager designates a focal point doctor, THE System SHALL validate the user has the doctor role
5. WHEN support materials are accessed, THE System SHALL enforce the same hospital-level RLS policies

### Requirement 25: Video Delivery Optimization

**User Story:** As a doctor, I want videos to load quickly and adapt to my network conditions, so that I can watch lessons without buffering or quality issues.

#### Acceptance Criteria

1. WHEN a video is served, THE System SHALL deliver it from a CDN with edge caching
2. WHEN a video is played, THE System SHALL support adaptive bitrate streaming (HLS or DASH)
3. WHEN a user navigates to a lesson, THE System SHALL preload video metadata but not the full video
4. WHEN a user completes a lesson, THE System SHALL preload the next lesson's video metadata
5. WHEN a video is encoded, THE System SHALL use H.264 codec with maximum 720p resolution
6. WHEN a user selects video quality, THE System SHALL offer 360p, 480p, and 720p options
7. WHEN a video is buffering, THE System SHALL display a clear buffering indicator

### Requirement 26: Notification System (Future)

**User Story:** As a doctor, I want to receive notifications when my doubts are answered, so that I can quickly review the responses.

#### Acceptance Criteria

1. WHEN a manager answers a doubt, THE System SHALL create a notification for the doctor
2. WHEN a doctor logs in, THE System SHALL display unread notification count
3. WHEN a doctor views a notification, THE System SHALL mark it as read
4. WHEN a notification is created, THE System SHALL optionally send an email notification
5. WHEN email notifications are sent, THE System SHALL respect user notification preferences

### Requirement 27: Compliance and Privacy

**User Story:** As a hospital administrator, I want the platform to comply with data privacy regulations, so that we meet legal requirements for handling personal and medical data.

#### Acceptance Criteria

1. THE System SHALL collect only necessary personal data for platform functionality
2. THE System SHALL provide a clear privacy policy and terms of service
3. WHEN a user requests their data, THE System SHALL provide an export of all their personal data
4. WHEN a user requests deletion, THE System SHALL permanently remove their personal data (right to be forgotten)
5. THE System SHALL encrypt all personally identifiable information at rest and in transit
6. THE System SHALL obtain explicit consent for data processing before account creation
7. THE System SHALL anonymize video watch history after 6 months for analytics purposes
