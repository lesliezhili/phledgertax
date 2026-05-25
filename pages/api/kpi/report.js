// pages/api/kpi/report.js
// Full KPI management dashboard — SC platform + financial + operational KPIs.
// GET → { scorecard, trends, period, metadata }
//   ?period=2026-05   filter bookings to a specific month (optional)
//   ?currency=AUD     filter financial transactions (optional)

import { generateKPIDashboard } from '@/lib/kpiReport';
import { DEFAULT_PLATFORM_CONFIG } from '@/lib/silverconnect';
import { loadAll } from '@/lib/store';
import path from 'path';
import fs from 'fs';

const DATA_DIR    = path.join(process.cwd(), 'sc_data');
const BOOK_PATH   = path.join(DATA_DIR, 'bookings.json');
const CFG_PATH    = path.join(DATA_DIR, 'platform_config.json');
const TARGET_PATH = path.join(DATA_DIR, 'kpi_targets.json');

function load(p, def) { try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return def; } }

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { period, currency } = req.query;

  // Load SC bookings
  let bookings = load(BOOK_PATH, []);
  if (period) bookings = bookings.filter(b => (b.service_date || '').startsWith(period));

  // Load PHLedger transactions from CSV store
  let transactions = [];
  try { transactions = loadAll(); } catch {}
  if (currency) transactions = transactions.filter(t => t.currency === currency);

  const config  = load(CFG_PATH, DEFAULT_PLATFORM_CONFIG);
  const targets = load(TARGET_PATH, {});

  const dashboard = generateKPIDashboard(bookings, transactions, config, targets);

  return res.json({
    ...dashboard,
    metadata: {
      booking_count:     bookings.length,
      transaction_count: transactions.length,
      period_filter:     period   || 'all',
      currency_filter:   currency || 'all',
      config_synced:     config.upstream_synced || false,
    },
  });
}
