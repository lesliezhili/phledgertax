import { loadAll, loadCountry, AU_BANKS, CA_BANKS } from '@/lib/store.js';
import { autoCategorise } from '@/lib/categoriser.js';
import { generateFinancialStatements } from '@/lib/financialStatements.js';
export default function handler(req, res) {
  const { country, as_of } = req.query;
  let txs = country ? loadCountry(country) : loadAll();
  txs = autoCategorise(txs);
  const asOf = as_of || new Date().toISOString().slice(0,10);
  const banks = country === 'AU' ? AU_BANKS : country === 'CA' ? CA_BANKS : [...AU_BANKS,...CA_BANKS];
  res.json({ ...generateFinancialStatements(asOf, txs), banks_included: banks });
}