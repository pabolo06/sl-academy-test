-- SL Academy Platform - Hospital Enterprise Features (Phase 1)
-- Adds: pgvector for RAG/CDSS, lesson embeddings, and credentialing rules

-- ============================================================================
-- 1. PGVECTOR EXTENSION
-- Required for semantic search on lesson/protocol content (Phase 2 CDSS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. LESSON EMBEDDINGS TABLE
-- Stores vector representations of lesson content for semantic search.
-- Separate table (not column on lessons) for:
--   - Clean separation of concerns
--   - Support for multiple embedding models in the future
--   - Dedicated IVFFlat index without bloating the lessons table
-- ============================================================================

CREATE TABLE lesson_embeddings (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id    UUID    NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    embedding    vector(1536) NOT NULL,              -- text-embedding-3-small
    model        TEXT    NOT NULL DEFAULT 'text-embedding-3-small',
    content_hash TEXT    NOT NULL,                   -- SHA-256 of source text (for dirty checks)
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lesson_id, model)                         -- one embedding per lesson per model
);

-- IVFFlat index for cosine similarity search (approximate nearest neighbor)
-- lists = 100 is suitable for up to ~1M vectors; tune to sqrt(row_count) in production
CREATE INDEX idx_lesson_embeddings_vector
    ON lesson_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_lesson_embeddings_lesson ON lesson_embeddings(lesson_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_lesson_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_embeddings_update_timestamp
  BEFORE UPDATE ON lesson_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_lesson_embeddings_updated_at();

-- RLS: only service role can write embeddings; all authenticated users can read
ALTER TABLE lesson_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read embeddings"
  ON lesson_embeddings FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE lesson_embeddings IS
  'Vector embeddings of lesson content for RAG-based CDSS queries (Phase 2).
   Each lesson has one embedding per model version. Indexed with IVFFlat for cosine similarity.';

COMMENT ON COLUMN lesson_embeddings.content_hash IS
  'SHA-256 of the source text used to generate the embedding. Used to detect stale vectors when lesson content changes.';

-- ============================================================================
-- 3. CREDENTIALING: required_score on tracks
-- Defines the minimum post-test score a doctor must achieve across ALL lessons
-- in a track before being eligible to be scheduled in the sector associated
-- with that track.
-- NULL means no certification requirement (track is informational only).
-- ============================================================================

ALTER TABLE tracks
  ADD COLUMN required_score NUMERIC(5,2) DEFAULT NULL
  CONSTRAINT chk_required_score CHECK (
    required_score IS NULL OR (required_score >= 0 AND required_score <= 100)
  );

COMMENT ON COLUMN tracks.required_score IS
  'Minimum post-test score (0-100) required for credentialing.
   NULL = no restriction. If set, doctors must achieve this score on ALL
   lessons in the track before being schedulable in the associated sector.';

-- ============================================================================
-- 4. CREDENTIALING: required_track_id on schedule_slots
-- Optional FK linking a specific slot to a track certification requirement.
-- Nullable: not all shifts require formal credentialing.
-- Allows different slots within the same week to require different certifications
-- (e.g., ICU slot requires ICU track, ER slot requires ER track).
-- ============================================================================

ALTER TABLE schedule_slots
  ADD COLUMN required_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;

CREATE INDEX idx_schedule_slots_required_track
  ON schedule_slots(required_track_id) WHERE required_track_id IS NOT NULL;

COMMENT ON COLUMN schedule_slots.required_track_id IS
  'If set, the doctor assigned to this slot must hold valid certification
   (test_attempts.score >= tracks.required_score for all lessons in the track).
   NULL = no credentialing check performed for this slot.';
