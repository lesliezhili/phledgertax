CREATE TABLE IF NOT EXISTS agent_sessions(id UUID DEFAULT gen_random_uuid() PRIMARY KEY,user_id TEXT,country TEXT DEFAULT 'ALL',created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS agent_messages(id UUID DEFAULT gen_random_uuid() PRIMARY KEY,session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,role TEXT NOT NULL,content TEXT NOT NULL,tool_name TEXT,tool_result JSONB,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS ledger_entries(id TEXT PRIMARY KEY,date DATE NOT NULL,narration TEXT,source TEXT,currency TEXT,lines JSONB NOT NULL,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,amount NUMERIC(12,2) NOT NULL,currency TEXT,rail TEXT,fee NUMERIC(8,2) DEFAULT 0,recipient TEXT,status TEXT DEFAULT 'initiated',created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS bas_drafts(id UUID DEFAULT gen_random_uuid() PRIMARY KEY,fy TEXT,quarter INT,g1 NUMERIC(12,2),g11 NUMERIC(12,2),gst_1a NUMERIC(12,2),gst_1b NUMERIC(12,2),net NUMERIC(12,2),status TEXT DEFAULT 'draft',created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_msg_sess ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(date);
