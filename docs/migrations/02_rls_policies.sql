-- =============================================================================
-- PRISM — Migration 02: Strict Row-Level Security (RLS) Policies
-- Tables: document_chunks, policy_sections, documents, policies
-- Security Invariant: auth.uid() = user_id for all operations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: public.document_chunks
-- -----------------------------------------------------------------------------
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 1.1 SELECT Policy: Users can only select their own chunks
DROP POLICY IF EXISTS "Users can select their own document chunks" ON public.document_chunks;
CREATE POLICY "Users can select their own document chunks"
  ON public.document_chunks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 1.2 INSERT Policy: Users can only insert chunks belonging to themselves
DROP POLICY IF EXISTS "Users can insert their own document chunks" ON public.document_chunks;
CREATE POLICY "Users can insert their own document chunks"
  ON public.document_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 1.3 UPDATE Policy: Users can only update their own chunks
DROP POLICY IF EXISTS "Users can update their own document chunks" ON public.document_chunks;
CREATE POLICY "Users can update their own document chunks"
  ON public.document_chunks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 1.4 DELETE Policy: Users can only delete their own chunks
DROP POLICY IF EXISTS "Users can delete their own document chunks" ON public.document_chunks;
CREATE POLICY "Users can delete their own document chunks"
  ON public.document_chunks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 2. Table: public.policy_sections
-- -----------------------------------------------------------------------------
ALTER TABLE public.policy_sections ENABLE ROW LEVEL SECURITY;

-- 2.1 SELECT Policy
DROP POLICY IF EXISTS "Users can select their own policy sections" ON public.policy_sections;
CREATE POLICY "Users can select their own policy sections"
  ON public.policy_sections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2.2 INSERT Policy
DROP POLICY IF EXISTS "Users can insert their own policy sections" ON public.policy_sections;
CREATE POLICY "Users can insert their own policy sections"
  ON public.policy_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2.3 UPDATE Policy
DROP POLICY IF EXISTS "Users can update their own policy sections" ON public.policy_sections;
CREATE POLICY "Users can update their own policy sections"
  ON public.policy_sections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2.4 DELETE Policy
DROP POLICY IF EXISTS "Users can delete their own policy sections" ON public.policy_sections;
CREATE POLICY "Users can delete their own policy sections"
  ON public.policy_sections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 3. Table: public.documents
-- -----------------------------------------------------------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3.1 SELECT Policy
DROP POLICY IF EXISTS "Users can select their own documents" ON public.documents;
CREATE POLICY "Users can select their own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3.2 INSERT Policy
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3.3 UPDATE Policy
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3.4 DELETE Policy
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 4. Table: public.policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- 4.1 SELECT Policy
DROP POLICY IF EXISTS "Users can select their own policies" ON public.policies;
CREATE POLICY "Users can select their own policies"
  ON public.policies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4.2 INSERT Policy
DROP POLICY IF EXISTS "Users can insert their own policies" ON public.policies;
CREATE POLICY "Users can insert their own policies"
  ON public.policies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4.3 UPDATE Policy
DROP POLICY IF EXISTS "Users can update their own policies" ON public.policies;
CREATE POLICY "Users can update their own policies"
  ON public.policies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4.4 DELETE Policy
DROP POLICY IF EXISTS "Users can delete their own policies" ON public.policies;
CREATE POLICY "Users can delete their own policies"
  ON public.policies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
