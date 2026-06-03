// pages/api/ledger/[country].ts — Query phledger_au or phledger_ca schema
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { country } = req.query;
  const c = (country as string || 'AU').toUpperCase();
  
  if (c !== 'AU' && c !== 'CA') {
    return res.status(400).json({ error: 'Country must be AU or CA' });
  }

  const schema = c === 'AU' ? 'phledger_au' : 'phledger_ca';
  const fy = c === 'AU'
    ? { start: '2026-07-01', end: '2027-06-30', label: 'FY2026-27 (Jul–Jun)' }
    : { start: '2026-01-01', end: '2026-12-31', label: 'FY2026 (Jan–Dec)' };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dtfbcvefttirngkjuqvl.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

  if (!supabaseKey) {
    // Fallback to CSV-based store
    const { loadCountry } = await import('@/lib/store.js');
    const { autoCategorise } = await import('@/lib/categoriser.js');
    const raw = loadCountry(c);
    const txs = autoCategorise(raw).filter((t: any) => t.date >= fy.start && t.date <= fy.end);
    const income = txs.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const expenses = txs.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0);
    return res.json({
      country: c,
      schema,
      fy: fy.label,
      source: 'csv_fallback',
      transactions: txs.length,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income + expenses) * 100) / 100,
      currency: c === 'AU' ? 'AUD' : 'CAD',
      bank: c === 'AU' ? 'ANZ' : 'RBC',
      sample: txs.slice(0, 5),
    });
  }

  // Use Supabase with schema
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(supabaseUrl, supabaseKey, { db: { schema } });
  
  const { from, to, bank, limit } = req.query;
  const dateFrom = (from as string) || fy.start;
  const dateTo = (to as string) || fy.end;
  
  let query = client.from('transactions').select('*').gte('date', dateFrom).lte('date', dateTo);
  if (bank) query = query.eq('bank', bank as string);
  
  const { data, error } = await query.order('date').limit(parseInt(limit as string) || 10000);
  
  if (error) return res.status(500).json({ error: error.message, schema });
  
  const txs = data || [];
  const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  res.json({
    country: c,
    schema,
    fy: fy.label,
    source: 'supabase',
    supabase_url: supabaseUrl,
    transactions: txs.length,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    net: Math.round((income + expenses) * 100) / 100,
    currency: c === 'AU' ? 'AUD' : 'CAD',
    bank: c === 'AU' ? 'ANZ' : 'RBC',
    tax_info: c === 'AU'
      ? { gst: '10%', super: '11.5%', bas: 'quarterly', company_tax: '25%' }
      : { gst: '5%', hst: '13%', cpp: '5.95%', ei: '1.63%', sbd: '9% on first $500K' },
    sample: txs.slice(0, 5),
  });
}
