-- Fase 1: Fundações de Dados e Regras Clínicas (HealthTech)
-- SL Academy Platform — pgvector + Credentialing Engine

-- ============================================================================
-- 1. PGVECTOR EXTENSION (RAG / CDSS foundation)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. EMBEDDING COLUMN ON LESSONS
-- Stores the vector representation of each lesson's content.
-- 1536 dimensions = text-embedding-3-small (OpenAI) standard.
-- Column on lessons (not a separate table) for simplicity at current scale.
-- ============================================================================

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for cosine similarity search (faster queries than IVFFlat,
-- no training step, better recall at high QPS)
CREATE INDEX IF NOT EXISTS lessons_embedding_idx
  ON lessons USING hnsw (embedding vector_cosine_ops);

COMMENT ON COLUMN lessons.embedding IS
  'Vector embedding (1536-dim, text-embedding-3-small) of lesson content.
   Used for RAG-based semantic search in the CDSS (Phase 2).
   NULL = not yet embedded.';

-- ============================================================================
-- 3. CREDENTIALING: required_score on tracks
-- Minimum post-test score required to certify in this track.
-- Default: 80% (clinical best-practice threshold).
-- ============================================================================

ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS required_score NUMERIC(5,2) DEFAULT 80.0
  CONSTRAINT chk_tracks_required_score
    CHECK (required_score >= 0 AND required_score <= 100);

COMMENT ON COLUMN tracks.required_score IS
  'Minimum post-test score (0-100) a doctor must achieve on ALL lessons
   in this track to hold active certification. Default: 80%.';

-- ============================================================================
-- 4. CREDENTIALING: required_track_id on schedules
-- Links a weekly schedule to a mandatory track certification.
-- If set, ALL slots in this schedule are restricted to certified doctors.
-- ============================================================================

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS required_track_id UUID
    REFERENCES tracks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schedules_required_track
  ON schedules(required_track_id) WHERE required_track_id IS NOT NULL;

COMMENT ON COLUMN schedules.required_track_id IS
  'If set, every doctor assigned to a slot in this schedule must hold
   active certification for this track (score >= tracks.required_score
   on all post-tests). NULL = no credentialing restriction.';
