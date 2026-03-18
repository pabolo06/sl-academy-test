-- SL Academy Platform - Row Level Security Policies (FIXED)
-- Implements multi-tenant isolation at database level

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS (using public schema instead of auth)
-- ============================================================================

-- Get current user's hospital_id from their profile
CREATE OR REPLACE FUNCTION public.user_hospital_id()
RETURNS UUID AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is a manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'manager' 
    AND deleted_at IS NULL
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- HOSPITALS POLICIES
-- ============================================================================

-- Users can only see their own hospital
CREATE POLICY hospitals_select_policy ON hospitals
    FOR SELECT
    USING (id = public.user_hospital_id() AND deleted_at IS NULL);

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can see profiles from their hospital
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    USING (hospital_id = public.user_hospital_id() AND deleted_at IS NULL);

-- Users can update their own profile
CREATE POLICY profiles_update_own_policy ON profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Managers can update profiles in their hospital
CREATE POLICY profiles_update_manager_policy ON profiles
    FOR UPDATE
    USING (
        hospital_id = public.user_hospital_id() 
        AND public.is_manager()
    );

-- ============================================================================
-- TRACKS POLICIES
-- ============================================================================

-- Users can see tracks from their hospital
CREATE POLICY tracks_select_policy ON tracks
    FOR SELECT
    USING (hospital_id = public.user_hospital_id() AND deleted_at IS NULL);

-- Managers can insert tracks
CREATE POLICY tracks_insert_policy ON tracks
    FOR INSERT
    WITH CHECK (
        hospital_id = public.user_hospital_id() 
        AND public.is_manager()
    );

-- Managers can update tracks
CREATE POLICY tracks_update_policy ON tracks
    FOR UPDATE
    USING (
        hospital_id = public.user_hospital_id() 
        AND public.is_manager()
    );

-- Managers can delete (soft delete) tracks
CREATE POLICY tracks_delete_policy ON tracks
    FOR DELETE
    USING (
        hospital_id = public.user_hospital_id() 
        AND public.is_manager()
    );

-- ============================================================================
-- LESSONS POLICIES
-- ============================================================================

-- Users can see lessons from their hospital's tracks
CREATE POLICY lessons_select_policy ON lessons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = lessons.track_id 
            AND tracks.hospital_id = public.user_hospital_id()
            AND tracks.deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Managers can insert lessons
CREATE POLICY lessons_insert_policy ON lessons
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = lessons.track_id 
            AND tracks.hospital_id = public.user_hospital_id()
            AND tracks.deleted_at IS NULL
        )
        AND public.is_manager()
    );

-- Managers can update lessons
CREATE POLICY lessons_update_policy ON lessons
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = lessons.track_id 
            AND tracks.hospital_id = public.user_hospital_id()
        )
        AND public.is_manager()
    );

-- Managers can delete lessons
CREATE POLICY lessons_delete_policy ON lessons
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = lessons.track_id 
            AND tracks.hospital_id = public.user_hospital_id()
        )
        AND public.is_manager()
    );

-- ============================================================================
-- QUESTIONS POLICIES
-- ============================================================================

-- Users can see questions from their hospital's lessons
CREATE POLICY questions_select_policy ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = questions.lesson_id
            AND t.hospital_id = public.user_hospital_id()
            AND l.deleted_at IS NULL
            AND t.deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Managers can insert questions
CREATE POLICY questions_insert_policy ON questions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = questions.lesson_id
            AND t.hospital_id = public.user_hospital_id()
        )
        AND public.is_manager()
    );

-- Managers can update questions
CREATE POLICY questions_update_policy ON questions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = questions.lesson_id
            AND t.hospital_id = public.user_hospital_id()
        )
        AND public.is_manager()
    );

-- ============================================================================
-- TEST ATTEMPTS POLICIES
-- ============================================================================

-- Users can see their own test attempts
CREATE POLICY test_attempts_select_policy ON test_attempts
    FOR SELECT
    USING (profile_id = auth.uid());

-- Managers can see all test attempts from their hospital
CREATE POLICY test_attempts_select_manager_policy ON test_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = test_attempts.profile_id
            AND profiles.hospital_id = public.user_hospital_id()
        )
        AND public.is_manager()
    );

-- Users can insert their own test attempts
CREATE POLICY test_attempts_insert_policy ON test_attempts
    FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = test_attempts.lesson_id
            AND t.hospital_id = public.user_hospital_id()
        )
    );

-- ============================================================================
-- DOUBTS POLICIES
-- ============================================================================

-- Users can see doubts from their hospital's lessons
CREATE POLICY doubts_select_policy ON doubts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = doubts.lesson_id
            AND t.hospital_id = public.user_hospital_id()
        )
        AND deleted_at IS NULL
        AND (
            -- Doctors see only their own doubts
            (public.user_role() = 'doctor' AND profile_id = auth.uid())
            -- Managers see all doubts from their hospital
            OR public.is_manager()
        )
    );

-- Doctors can insert doubts
CREATE POLICY doubts_insert_policy ON doubts
    FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = doubts.lesson_id
            AND t.hospital_id = public.user_hospital_id()
        )
    );

-- Managers can update doubts (answer them)
CREATE POLICY doubts_update_policy ON doubts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lessons l
            JOIN tracks t ON l.track_id = t.id
            WHERE l.id = doubts.lesson_id
            AND t.hospital_id = public.user_hospital_id()
        )
        AND public.is_manager()
    );

-- ============================================================================
-- INDICATORS POLICIES
-- ============================================================================

-- Users can see indicators from their hospital
CREATE POLICY indicators_select_policy ON indicators
    FOR SELECT
    USING (hospital_id = public.user_hospital_id() AND deleted_at IS NULL);

-- Managers can insert indicators
CREATE POLICY indicators_insert_policy ON indicators
    FOR INSERT
    WITH CHECK (
        hospital_id = public.user_hospital_id()
        AND public.is_manager()
    );

-- Managers can update indicators
CREATE POLICY indicators_update_policy ON indicators
    FOR UPDATE
    USING (
        hospital_id = public.user_hospital_id()
        AND public.is_manager()
    );

-- Managers can delete indicators
CREATE POLICY indicators_delete_policy ON indicators
    FOR DELETE
    USING (
        hospital_id = public.user_hospital_id()
        AND public.is_manager()
    );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON FUNCTION public.user_hospital_id() IS 'Returns the hospital_id of the currently authenticated user';
COMMENT ON FUNCTION public.user_role() IS 'Returns the role (manager or doctor) of the currently authenticated user';
COMMENT ON FUNCTION public.is_manager() IS 'Returns true if the currently authenticated user is a manager';
