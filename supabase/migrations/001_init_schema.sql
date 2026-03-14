-- SL Academy Platform - Initial Schema Migration
-- Creates all core tables, types, constraints, and indexes

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('manager', 'doctor');
CREATE TYPE question_type AS ENUM ('pre', 'post');
CREATE TYPE doubt_status AS ENUM ('pending', 'answered');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Hospitals table (multi-tenant root)
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_hospitals_deleted ON hospitals(deleted_at) WHERE deleted_at IS NULL;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    is_focal_point BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_role CHECK (role IN ('manager', 'doctor'))
);

CREATE INDEX idx_profiles_hospital ON profiles(hospital_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;

-- Tracks table (learning paths)
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tracks_hospital ON tracks(hospital_id) WHERE deleted_at IS NULL;

-- Lessons table (individual learning units)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    "order" INTEGER NOT NULL CHECK ("order" >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(track_id, "order")
);

CREATE INDEX idx_lessons_track ON lessons(track_id, "order") WHERE deleted_at IS NULL;

-- Questions table (pre and post-test questions)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2),
    CONSTRAINT valid_correct_index CHECK (correct_option_index >= 0)
);

CREATE INDEX idx_questions_lesson ON questions(lesson_id, type) WHERE deleted_at IS NULL;

-- Test attempts table (user test submissions)
CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    answers JSONB NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_test_attempts_profile ON test_attempts(profile_id, completed_at DESC);
CREATE INDEX idx_test_attempts_lesson ON test_attempts(lesson_id, type);

-- Doubts table (questions from doctors)
CREATE TABLE doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    image_url TEXT,
    status doubt_status DEFAULT 'pending',
    answer TEXT,
    answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_doubts_status ON doubts(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_doubts_lesson ON doubts(lesson_id) WHERE deleted_at IS NULL;

-- Indicators table (hospital performance metrics)
CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    category TEXT NOT NULL,
    reference_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_indicators_hospital ON indicators(hospital_id, reference_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_indicators_category ON indicators(category, reference_date DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE hospitals IS 'Multi-tenant root table - each hospital is a separate tenant';
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users with hospital context';
COMMENT ON TABLE tracks IS 'Learning tracks (collections of lessons)';
COMMENT ON TABLE lessons IS 'Individual lessons with video content';
COMMENT ON TABLE questions IS 'Pre and post-test questions for lessons';
COMMENT ON TABLE test_attempts IS 'User test submissions and scores';
COMMENT ON TABLE doubts IS 'Questions submitted by doctors about lesson content';
COMMENT ON TABLE indicators IS 'Hospital performance and safety metrics';

COMMENT ON COLUMN profiles.is_focal_point IS 'Focal point doctors have access to specialized support materials';
COMMENT ON COLUMN lessons."order" IS 'Ordering within track - must be unique per track';
COMMENT ON COLUMN test_attempts.answers IS 'JSON object mapping question_id to selected_option_index';
COMMENT ON COLUMN indicators.reference_date IS 'Date the indicator measurement was taken';
