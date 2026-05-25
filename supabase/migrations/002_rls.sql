-- ============================================================
-- Migration 002: Enable Row Level Security (multi-user)
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/dtfbcvefttirngkjuqvl/sql
-- ============================================================

-- ─── 1. Enable RLS on both tables ───────────────────────────────────
ALTER TABLE public.transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_log    ENABLE ROW LEVEL SECURITY;

-- ─── 2. transactions policies ────────────────────────────────────────
-- Each user sees only their own rows (owner = auth.uid())
CREATE POLICY "users_select_own_transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "users_insert_own_transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_update_own_transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "users_delete_own_transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = owner_id);

-- ─── 3. migration_log policies ───────────────────────────────────────
CREATE POLICY "users_select_own_migration_log"
  ON public.migration_log FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "users_insert_own_migration_log"
  ON public.migration_log FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ─── 4. Add owner_id column (if not already present) ─────────────────
-- Only run these if you did NOT include owner_id in 001_init.sql
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.migration_log
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── 5. Backfill existing rows to a service account UID ──────────────
-- Replace <service-account-uid> with your Supabase service account UUID
-- (from: https://supabase.com/dashboard/project/dtfbcvefttirngkjuqvl/auth/users)
-- UPDATE public.transactions  SET owner_id = '<service-account-uid>' WHERE owner_id IS NULL;
-- UPDATE public.migration_log SET owner_id = '<service-account-uid>' WHERE owner_id IS NULL;

-- ─── 6. Make owner_id NOT NULL (after backfill) ───────────────────────
-- ALTER TABLE public.transactions  ALTER COLUMN owner_id SET NOT NULL;
-- ALTER TABLE public.migration_log ALTER COLUMN owner_id SET NOT NULL;

-- ─── 7. Index on owner_id for query performance ───────────────────────
CREATE INDEX IF NOT EXISTS idx_tx_owner         ON public.transactions (owner_id);
CREATE INDEX IF NOT EXISTS idx_migration_owner  ON public.migration_log (owner_id);

-- ─── NOTES ────────────────────────────────────────────────────────────
-- * Service-role key (used in SUPABASE_KEY) BYPASSES RLS — safe for
--   server-side API routes (Next.js /api/*).
-- * For client-side Supabase calls, use NEXT_PUBLIC_SUPABASE_ANON_KEY
--   with the user's JWT — RLS will filter rows automatically.
-- * To verify RLS is active:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public';
