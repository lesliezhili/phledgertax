import { loadCountry, CA_BANKS } from '@/lib/store.js';
import { autoCategorise } from '@/lib/categoriser.js';
import { generateQuarterlyGst } from '@/lib/taxCa.js';
export default function handler(req, res) {
  const txs = autoCategorise(loadCountry('CA'));
  const now  = new Date();
  const year = parseInt(req.query.year)    || now.getFullYear();
  const q    = parseInt(req.query.quarter) || Math.floor(now.getMonth()/3)+1;
  res.json({ ...generateQuarterlyGst(year, q, txs), banks_included: CA_BANKS });
}