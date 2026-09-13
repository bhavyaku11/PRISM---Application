-- =============================================================================
-- PRISM — Step 9: PGVector Migration & Retrieval Function Setup
-- Target Embedding Model: BAAI/bge-small-en-v1.5 (384 dimensions)
-- =============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Alter embedding column in document_chunks to exact 384 dimensions
ALTER TABLE public.document_chunks 
  ALTER COLUMN embedding TYPE vector(384);

-- 3. Create or replace similarity search function with user isolation
CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(384),
    match_count int DEFAULT 5,
    match_threshold float DEFAULT 0.0,
    filter_user_id uuid DEFAULT NULL,
    filter_policy_id uuid DEFAULT NULL,
    filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    policy_id uuid,
    page_number int,
    section_title text,
    content text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.policy_id,
        dc.page_number,
        dc.section_title,
        dc.content,
        -- Cosine similarity: 1 - cosine distance
        (1 - (dc.embedding <=> query_embedding))::float AS similarity
    FROM public.document_chunks dc
    WHERE dc.embedding IS NOT NULL
      -- Strict authorization filter
      AND (filter_user_id IS NULL OR dc.user_id = filter_user_id)
      AND (filter_policy_id IS NULL OR dc.policy_id = filter_policy_id)
      AND (filter_document_id IS NULL OR dc.document_id = filter_document_id)
      AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 4. Create an HNSW / IVFFlat cosine similarity index if table has data
-- (Recommended when chunk count exceeds ~1000 chunks)
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
--   ON public.document_chunks
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);
