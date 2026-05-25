import { loadCountry, AU_BANKS } from '@/lib/store.js';
import { autoCategorise } from '@/lib/categoriser.js';
import { generateBasDraft } from '@/lib/basAu.js';
export default function handler(req, res) {
  const txs = autoCategorise(loadCountry('AU'));
  const { start, end } = req.query;
  const today = new Date().toISOString().slice(0,10);
  const dates = txs.map(t=>t.date).sort();
  const s = start || dates[0] || `${new Date().getFullYear()}-07-01`;
  const e = end   || today;
  res.json({ ...generateBasDraft(txs, s, e), banks_included: AU_BANKS });
}