-- Fase 2: CDSS via RAG — Funções Postgres para Busca Semântica
-- Requer pgvector (migration 010)

-- ============================================================================
-- match_lessons: busca semântica por similaridade de cosseno
-- Chamada via Supabase RPC: db.rpc("match_lessons", {...})
-- ============================================================================

CREATE OR REPLACE FUNCTION match_lessons(
    query_embedding  vector(1536),
    hospital_id_param UUID,
    match_threshold  float DEFAULT 0.5,
    match_count      int   DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    title       TEXT,
    description TEXT,
    track_id    UUID,
    track_title TEXT,
    similarity  float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.title,
        l.description,
        l.track_id,
        t.title        AS track_title,
        1 - (l.embedding <=> query_embedding) AS similarity
    FROM lessons l
    JOIN tracks t ON l.track_id = t.id
    WHERE t.hospital_id = hospital_id_param
      AND l.deleted_at  IS NULL
      AND t.deleted_at  IS NULL
      AND l.embedding   IS NOT NULL
      AND 1 - (l.embedding <=> query_embedding) > match_threshold
    ORDER BY l.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_lessons IS
  'Semantic similarity search over lesson embeddings for a specific hospital.
   Returns lessons ordered by cosine similarity to the query vector.
   Used by the CDSS to find relevant clinical protocols (POPs) for RAG responses.';
