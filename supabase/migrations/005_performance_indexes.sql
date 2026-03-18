-- Migration: Performance Indexes
-- Description: Add indexes to optimize slow queries identified in load testing
-- Date: 2024-03-14

-- ============================================================================
-- INDICATORS TABLE INDEXES
-- ============================================================================

-- Index for date range queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_indicators_hospital_date 
ON indicators(hospital_id, reference_date DESC)
WHERE deleted_at IS NULL;

-- Index for category filtering with date range
CREATE INDEX IF NOT EXISTS idx_indicators_hospital_category_date 
ON indicators(hospital_id, category, reference_date DESC)
WHERE deleted_at IS NULL;

-- Index for indicator name lookups (used in import upsert)
CREATE INDEX IF NOT EXISTS idx_indicators_hospital_name_date 
ON indicators(hospital_id, name, reference_date)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_indicators_hospital_date IS 
'Optimizes date range queries for indicators dashboard';

COMMENT ON INDEX idx_indicators_hospital_category_date IS 
'Optimizes category-filtered date range queries';

COMMENT ON INDEX idx_indicators_hospital_name_date IS 
'Optimizes indicator import duplicate checking';

-- ============================================================================
-- DOUBTS TABLE INDEXES
-- ============================================================================

-- Index for lesson-specific doubts
CREATE INDEX IF NOT EXISTS idx_doubts_lesson_status 
ON doubts(lesson_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for manager doubt queries (includes answered_by for JOIN optimization)
CREATE INDEX IF NOT EXISTS idx_doubts_answered_by 
ON doubts(answered_by)
WHERE answered_by IS NOT NULL AND deleted_at IS NULL;

COMMENT ON INDEX idx_doubts_lesson_status IS 
'Optimizes lesson-specific doubt queries';

COMMENT ON INDEX idx_doubts_answered_by IS 
'Optimizes JOIN with profiles for answered_by information';

-- ============================================================================
-- TEST_ATTEMPTS TABLE INDEXES
-- ============================================================================

-- Index for user test history
CREATE INDEX IF NOT EXISTS idx_test_attempts_profile_date 
ON test_attempts(profile_id, completed_at DESC);

-- Index for lesson test statistics
CREATE INDEX IF NOT EXISTS idx_test_attempts_lesson_type 
ON test_attempts(lesson_id, type, completed_at DESC);

COMMENT ON INDEX idx_test_attempts_profile_date IS 
'Optimizes user test history queries';

COMMENT ON INDEX idx_test_attempts_lesson_type IS 
'Optimizes lesson test statistics aggregation';

-- ============================================================================
-- TRACKS TABLE INDEXES
-- ============================================================================

-- Index for active tracks listing (excludes soft-deleted)
CREATE INDEX IF NOT EXISTS idx_tracks_hospital_active 
ON tracks(hospital_id, created_at DESC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_tracks_hospital_active IS 
'Optimizes active tracks listing';

-- ============================================================================
-- LESSONS TABLE INDEXES
-- ============================================================================

-- Index for track lessons with ordering
CREATE INDEX IF NOT EXISTS idx_lessons_track_order 
ON lessons(track_id, "order" ASC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_lessons_track_order IS 
'Optimizes lesson listing with proper ordering';

-- ============================================================================
-- QUESTIONS TABLE INDEXES
-- ============================================================================

-- Index for lesson questions by type
CREATE INDEX IF NOT EXISTS idx_questions_lesson_type 
ON questions(lesson_id, type)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_questions_lesson_type IS 
'Optimizes question retrieval for pre/post tests';

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Index for hospital user listings
CREATE INDEX IF NOT EXISTS idx_profiles_hospital_role 
ON profiles(hospital_id, role, created_at DESC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_profiles_hospital_role IS 
'Optimizes user management queries with role filtering';

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================

-- Index for audit log queries by hospital and event type
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_event 
ON audit_logs(hospital_id, event_type, created_at DESC);

-- Index for user-specific audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
ON audit_logs(user_id, created_at DESC);

-- Index for recent audit logs (most common query)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent 
ON audit_logs(created_at DESC);

COMMENT ON INDEX idx_audit_logs_hospital_event IS 
'Optimizes audit log filtering by hospital and event type';

COMMENT ON INDEX idx_audit_logs_user IS 
'Optimizes user-specific audit log queries';

COMMENT ON INDEX idx_audit_logs_recent IS 
'Optimizes recent audit log queries';

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update table statistics for query planner
ANALYZE indicators;
ANALYZE doubts;
ANALYZE test_attempts;
ANALYZE tracks;
ANALYZE lessons;
ANALYZE questions;
ANALYZE profiles;
ANALYZE audit_logs;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- Query to verify all indexes were created
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'Created % performance indexes', index_count;
END $$;
