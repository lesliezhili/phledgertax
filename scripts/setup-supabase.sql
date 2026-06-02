-- PHLedger Supabase Setup — Run in SQL Editor (app.supabase.com)
-- Cost: $0 (Free tier: 500MB storage, 50K API requests/mo)

-- 1. Agent sessions
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('AU','CA','ALL')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Chat messages
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','agent','system')),
  content TEXT NOT NULL,
  tool_name TEXT,
  tool_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ledger entries (double-entry journal — replaces Xero $65/mo)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  narration TEXT,
  source TEXT CHECK (source IN ('anz','rbc','manual','system')),
  currency TEXT CHECK (currency IN ('AUD','CAD')),
  country TEXT CHECK (country IN ('AU','CA')),
  lines JSONB NOT NULL,
  is_reconciled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Payments (PayTo/Interac — replaces Stripe)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT CHECK (currency IN ('AUD','CAD')),
  rail TEXT CHECK (rail IN ('payto_npp','interac','becs')),
  fee NUMERIC(8,2) DEFAULT 0,
  recipient TEXT,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated','pending','settled','failed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- 5. BAS quarterly returns
CREATE TABLE IF NOT EXISTS bas_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fy TEXT NOT NULL,
  quarter INT CHECK (quarter BETWEEN 1 AND 4),
  g1 NUMERIC(12,2),
  g11 NUMERIC(12,2),
  gst_1a NUMERIC(12,2),
  gst_1b NUMERIC(12,2),
  net NUMERIC(12,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','lodged')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_msg_session ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(date);
CREATE INDEX IF NOT EXISTS idx_ledger_country ON ledger_entries(country);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS (enable but allow all for now — tighten with auth later)
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bas_drafts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_sessions') THEN
    CREATE POLICY allow_all_sessions ON agent_sessions FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_messages') THEN
    CREATE POLICY allow_all_messages ON agent_messages FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_ledger') THEN
    CREATE POLICY allow_all_ledger ON ledger_entries FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_payments') THEN
    CREATE POLICY allow_all_payments ON payments FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_bas') THEN
    CREATE POLICY allow_all_bas ON bas_drafts FOR ALL USING (true);
  END IF;
END $$;

-- Done! Copy your Project URL + service_role key to Vercel env vars.
