import path from 'path';
import fs from 'fs';
import { loadAll } from '@/lib/store.js';
import { autoCategorise, DEFAULT_COA, DEFAULT_RULES } from '@/lib/categoriser.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const rp = path.join(process.cwd(), 'migration_output', 'migration_report.json');
    if (fs.existsSync(rp)) return res.json(JSON.parse(fs.readFileSync(rp,'utf-8')));
    return res.json({ status: 'not_run' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const txs = autoCategorise(loadAll());
    const outDir = path.join(process.cwd(), 'migration_output');
    fs.mkdirSync(outDir, { recursive: true });
    // Seed config
    const coaPath = path.join(process.cwd(),'chart_of_accounts.json');
    const rulesPath = path.join(process.cwd(),'classification_rules.json');
    if (!fs.existsSync(coaPath)) fs.writeFileSync(coaPath, JSON.stringify(DEFAULT_COA, null, 2));
    if (!fs.existsSync(rulesPath)) fs.writeFileSync(rulesPath, JSON.stringify(DEFAULT_RULES.map(r => ({...r, pattern: r.pattern.toString()})), null, 2));
    const dates = txs.map(t=>t.date).sort();
    const report = {
      total_transactions: txs.length,
      date_range: { from: dates[0] || null, to: dates[dates.length-1] || null },
      by_bank: txs.reduce((m,t)=>{ m[t.bank||'unknown']=(m[t.bank||'unknown']||0)+1; return m; },{}),
      by_currency: txs.reduce((m,t)=>{ m[t.currency]=(m[t.currency]||0)+1; return m; },{}),
      total_income_aud: Math.round(txs.filter(t=>t.amount>0&&t.currency==='AUD').reduce((s,t)=>s+t.amount,0)*100)/100,
      total_expenses_aud: Math.round(txs.filter(t=>t.amount<0&&t.currency==='AUD').reduce((s,t)=>s+Math.abs(t.amount),0)*100)/100,
      total_income_cad: Math.round(txs.filter(t=>t.amount>0&&t.currency==='CAD').reduce((s,t)=>s+t.amount,0)*100)/100,
      total_expenses_cad: Math.round(txs.filter(t=>t.amount<0&&t.currency==='CAD').reduce((s,t)=>s+Math.abs(t.amount),0)*100)/100,
    };
    fs.writeFileSync(path.join(outDir,'migration_report.json'), JSON.stringify(report,null,2));
    res.json({ status: 'complete', ...report });
  } catch(e) { res.status(500).json({ error: String(e) }); }
}