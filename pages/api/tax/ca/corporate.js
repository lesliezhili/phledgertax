import { loadCountry, CA_BANKS } from '../../../../lib/store.js';
import { autoCategorise } from '../../../../lib/categoriser.js';
import { draftCaCorporateTax } from '../../../../lib/taxCa.js';
export default function handler(req, res) {
  const txs  = autoCategorise(loadCountry('CA'));
  const year = parseInt(req.query.year) || new Date().getFullYear();
  res.json({ ...draftCaCorporateTax(year, txs), banks_included: CA_BANKS });
}