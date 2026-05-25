import { loadAll, loadCountry, AU_BANKS, CA_BANKS } from '../../../lib/store.js';
import { autoCategorise } from '../../../lib/categoriser.js';
export default function handler(req, res) {
  const { country } = req.query;
  let txs = country ? loadCountry(country) : loadAll();
  txs = autoCategorise(txs);
  const income   = txs.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const banks = country === 'AU' ? AU_BANKS : country === 'CA' ? CA_BANKS : [...AU_BANKS,...CA_BANKS];
  res.json({ country: country || 'ALL', banks_included: banks,
             total_transactions: txs.length, total_income: Math.round(income*100)/100,
             total_expenses: Math.round(expenses*100)/100, net: Math.round((income-expenses)*100)/100 });
}