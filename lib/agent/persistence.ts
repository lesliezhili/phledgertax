// Agent persistence — Supabase free tier (500MB, 50K req/mo)
// Falls back gracefully to stateless mode if env vars not set
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const sb = url && key ? createClient(url, key) : null;

export async function createSession(country = 'ALL') {
  if (!sb) return { id: 'local-' + Date.now(), country };
  const { data, error } = await sb.from('agent_sessions').insert({ country }).select().single();
  if (error) { console.warn('Session create failed:', error.message); return { id: 'local-' + Date.now(), country }; }
  return data;
}

export async function saveMessage(sessionId, role, content, toolName = null, toolResult = null) {
  if (!sb || sessionId.startsWith('local-')) return;
  await sb.from('agent_messages').insert({ session_id: sessionId, role, content, tool_name: toolName, tool_result: toolResult });
}

export async function getMessages(sessionId, limit = 50) {
  if (!sb || sessionId.startsWith('local-')) return [];
  const { data } = await sb.from('agent_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }).limit(limit);
  return data || [];
}

export async function saveLedgerEntry(entry) {
  if (!sb) return;
  await sb.from('ledger_entries').upsert({ id: entry.id, date: entry.date, narration: entry.narration || entry.desc, source: entry.src || entry.source, currency: entry.cur || entry.currency, lines: entry.lines, country: entry.currency === 'AUD' ? 'AU' : 'CA' });
}

export async function savePayment(payment) {
  if (!sb) return;
  await sb.from('payments').insert(payment);
}

export async function saveBas(bas) {
  if (!sb) return;
  await sb.from('bas_drafts').insert(bas);
}

export function isConnected() { return !!sb; }
