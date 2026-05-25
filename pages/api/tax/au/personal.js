import { loadCountry, AU_BANKS } from '@/lib/store.js';
import { autoCategorise } from '@/lib/categoriser.js';
import { draftAuPersonalTax } from '@/lib/taxAu.js';
export default function handler(req, res) {
  const txs  = autoCategorise(loadCountry('AU'));
  const year = parseInt(req.query.year) || new Date().getFullYear();
  res.json({ ...draftAuPersonalTax(year, txs), banks_included: AU_BANKS });
}