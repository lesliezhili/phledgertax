// lib/kpiReport.js
// PHLedger — KPI Management Reporting Engine
//
// Produces a management-ready KPI scorecard combining:
//   1. SilverConnect Platform KPIs  (from sc_data/bookings.json)
//   2. Financial KPIs               (from PHLedger transactions)
//
// Each KPI has: id, name, category, actual, target, variance, variance_pct,
//               status (ON_TRACK | AT_RISK | OFF_TRACK), trend (MoM %)
//
// Targets are stored in sc_data/kpi_targets.json and loaded at runtime.
// If no target is defined for a KPI, status = 'NO_TARGET'.

// ─── KPI Catalogue ─────────────────────────────────────────────────────
// Defines all KPIs, their calculation category, format, and default targets.
// status_thresholds: [at_risk_pct, off_track_pct] — percentage below target.
//   e.g. [5, 15] means: <5% below = ON_TRACK, 5–15% = AT_RISK, >15% = OFF_TRACK
// For KPIs where lower is better (refund_rate, cancellation_rate), invert flag = true.

export const KPI_CATALOGUE = [
  // ── SilverConnect Platform ─────────────────────────────────────────
  { id: 'SC01', name: 'Total Bookings',          category: 'SC Platform', format: 'number',  invert: false, thresholds: [5,  15], default_target: 50  },
  { id: 'SC02', name: 'Completed Bookings',      category: 'SC Platform', format: 'number',  invert: false, thresholds: [5,  15], default_target: 40  },
  { id: 'SC03', name: 'Cancellation Rate',       category: 'SC Platform', format: 'percent', invert: true,  thresholds: [2,   5], default_target: 0.10 },
  { id: 'SC04', name: 'Platform Fee Revenue',    category: 'SC Platform', format: 'currency',invert: false, thresholds: [5,  15], default_target: 750 },
  { id: 'SC05', name: 'Total Provider Payouts',  category: 'SC Platform', format: 'currency',invert: false, thresholds: [5,  15], default_target: 4250 },
  { id: 'SC06', name: 'Net Platform Revenue',    category: 'SC Platform', format: 'currency',invert: false, thresholds: [5,  15], default_target: 700 },
  { id: 'SC07', name: 'Avg Booking Value',       category: 'SC Platform', format: 'currency',invert: false, thresholds: [5,  10], default_target: 100 },
  { id: 'SC08', name: 'Refund Rate',             category: 'SC Platform', format: 'percent', invert: true,  thresholds: [2,   5], default_target: 0.05 },
  { id: 'SC09', name: 'Active Providers',        category: 'SC Platform', format: 'number',  invert: false, thresholds: [10, 25], default_target: 10  },
  { id: 'SC10', name: 'Revenue per Provider',    category: 'SC Platform', format: 'currency',invert: false, thresholds: [5,  15], default_target: 75  },
  // ── Financial ──────────────────────────────────────────────────────
  { id: 'FI01', name: 'Total Income',            category: 'Financial',   format: 'currency',invert: false, thresholds: [5,  15], default_target: null },
  { id: 'FI02', name: 'Total Expenses',          category: 'Financial',   format: 'currency',invert: true,  thresholds: [5,  15], default_target: null },
  { id: 'FI03', name: 'Net Profit',              category: 'Financial',   format: 'currency',invert: false, thresholds: [5,  15], default_target: null },
  { id: 'FI04', name: 'Gross Profit Margin',     category: 'Financial',   format: 'percent', invert: false, thresholds: [3,  10], default_target: 0.30 },
  { id: 'FI05', name: 'GST Collected (AU)',      category: 'Financial',   format: 'currency',invert: false, thresholds: [5,  15], default_target: null },
  { id: 'FI06', name: 'GST Paid (AU)',           category: 'Financial',   format: 'currency',invert: false, thresholds: [5,  15], default_target: null },
  { id: 'FI07', name: 'Net GST Payable (AU)',    category: 'Financial',   format: 'currency',invert: false, thresholds: [5,  15], default_target: null },
  { id: 'FI08', name: 'GST Collected (CA)',      category: 'Financial',   format: 'currency',invert: false, thresholds: [5,  15], default_target: null },
  // ── SC Operational ─────────────────────────────────────────────────
  { id: 'OP01', name: 'Pending Refunds',         category: 'Operational', format: 'number',  invert: true,  thresholds: [0,   1], default_target: 0   },
  { id: 'OP02', name: 'Upstream Config Synced',  category: 'Operational', format: 'boolean', invert: false, thresholds: [0,   0], default_target: 1   },
  { id: 'OP03', name: 'Platform Fee Rate',       category: 'Operational', format: 'percent', invert: false, thresholds: [0,   0], default_target: 0.15 },
  { id: 'OP04', name: 'Provider Rate',           category: 'Operational', format: 'percent', invert: false, thresholds: [0,   0], default_target: 0.85 },
];

// ─── SC Platform KPIs ──────────────────────────────────────────────────

export function calculateSCKPIs(bookings, config = {}) {
  const total        = bookings.length;
  const completed    = bookings.filter(b => b.status === 'completed').length;
  const cancelled    = bookings.filter(b => b.status === 'cancelled' || b.status === 'refunded').length;
  const pending_ref  = bookings.filter(b => b.status === 'pending_refund').length;

  const grossTotal   = sum(bookings, b => b.gross_amount || 0);
  const feeTotal     = sum(bookings, b => b.platform_fee  || 0);
  const payoutTotal  = sum(bookings, b => b.provider_payout || 0);
  const refundTotal  = sum(bookings, b => b.refund?.client_refund || 0);
  const clawbackTotal= sum(bookings, b => b.refund?.provider_clawback || 0);

  const netRevenue   = r2(feeTotal - refundTotal + sum(bookings, b => b.refund?.cancellation_fee || 0));
  const avgBooking   = total > 0 ? r2(grossTotal / total) : 0;

  const providerIds  = new Set(bookings.map(b => b.provider_id).filter(Boolean));
  const activeProviders = providerIds.size;
  const revPerProvider  = activeProviders > 0 ? r2(feeTotal / activeProviders) : 0;

  const cancRate  = total > 0 ? r2(cancelled / total) : 0;
  const refundRate= total > 0 ? r2(bookings.filter(b => b.status === 'refunded').length / total) : 0;

  return {
    SC01: total,
    SC02: completed,
    SC03: cancRate,
    SC04: r2(feeTotal),
    SC05: r2(payoutTotal - clawbackTotal),
    SC06: netRevenue,
    SC07: avgBooking,
    SC08: refundRate,
    SC09: activeProviders,
    SC10: revPerProvider,
    OP01: pending_ref,
    OP02: config.upstream_synced ? 1 : 0,
    OP03: config.platform_fee_rate || 0.15,
    OP04: config.provider_rate     || 0.85,
  };
}

// ─── Financial KPIs ────────────────────────────────────────────────────

export function calculateFinancialKPIs(transactions) {
  const txs = transactions || [];
  const auTxs = txs.filter(t => t.currency === 'AUD');
  const caTxs = txs.filter(t => t.currency === 'CAD');

  const income   = r2(sum(txs, t =>  t.amount > 0 ? t.amount : 0));
  const expenses = r2(sum(txs, t => t.amount  < 0 ? Math.abs(t.amount) : 0));
  const netProfit= r2(income - expenses);
  const margin   = income > 0 ? r2(netProfit / income) : 0;

  // AU GST: 10% — collected on income, paid on expenses (1/11 of GST-inclusive)
  const gstAuCollected = r2(sum(auTxs.filter(t => t.amount > 0 && t.tax_code && t.tax_code.includes('GST')), t => t.amount / 11));
  const gstAuPaid      = r2(sum(auTxs.filter(t => t.amount < 0 && t.tax_code === 'GST'), t => Math.abs(t.amount) / 11));
  const gstAuNet       = r2(gstAuCollected - gstAuPaid);

  // CA GST/HST: 5% federal component
  const gstCaCollected = r2(sum(caTxs.filter(t => t.amount > 0 && t.tax_code && t.tax_code.includes('GST')), t => t.amount * 0.05 / 1.05));

  return {
    FI01: income,
    FI02: expenses,
    FI03: netProfit,
    FI04: margin,
    FI05: gstAuCollected,
    FI06: gstAuPaid,
    FI07: gstAuNet,
    FI08: gstCaCollected,
  };
}

// ─── Scorecard Assembly ────────────────────────────────────────────────

/**
 * Build the full management KPI scorecard.
 * Merges SC platform + financial actuals, compares against targets,
 * calculates variance, and assigns traffic-light status.
 *
 * @param {object}   scActuals   - output of calculateSCKPIs()
 * @param {object}   fiActuals   - output of calculateFinancialKPIs()
 * @param {object}   targets     - { SC01: 50, SC04: 750, FI04: 0.30, ... }
 * @returns {KPIScorecard}
 */
export function buildScorecard(scActuals, fiActuals, targets = {}) {
  const actuals = { ...scActuals, ...fiActuals };
  const cards   = KPI_CATALOGUE.map(kpi => {
    const actual = actuals[kpi.id];
    const target = targets[kpi.id] !== undefined ? targets[kpi.id] : kpi.default_target;

    if (actual === undefined || actual === null) {
      return { ...kpi, actual: null, target, variance: null, variance_pct: null, status: 'NO_DATA' };
    }
    if (target === null || target === undefined) {
      return { ...kpi, actual, target: null, variance: null, variance_pct: null, status: 'NO_TARGET' };
    }

    const variance     = r2(actual - target);
    const variance_pct = target !== 0 ? r2(variance / Math.abs(target)) : null;

    // Status logic — for inverted KPIs (lower is better), flip the sign
    const effectivePct = kpi.invert ? -variance_pct : variance_pct;
    const [atRisk, offTrack] = kpi.thresholds.map(t => t / 100);
    let status = 'ON_TRACK';
    if (effectivePct !== null) {
      if (effectivePct < -offTrack)  status = 'OFF_TRACK';
      else if (effectivePct < -atRisk) status = 'AT_RISK';
    }
    // Boolean KPIs: just ON/OFF
    if (kpi.format === 'boolean') {
      status = actual >= 1 ? 'ON_TRACK' : 'OFF_TRACK';
    }

    return { ...kpi, actual, target, variance, variance_pct, status };
  });

  const byCategory = cards.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const summary = {
    total:      cards.length,
    on_track:   cards.filter(c => c.status === 'ON_TRACK').length,
    at_risk:    cards.filter(c => c.status === 'AT_RISK').length,
    off_track:  cards.filter(c => c.status === 'OFF_TRACK').length,
    no_target:  cards.filter(c => c.status === 'NO_TARGET').length,
    no_data:    cards.filter(c => c.status === 'NO_DATA').length,
  };

  return { cards, by_category: byCategory, summary, generated_at: new Date().toISOString() };
}

// ─── Trend Calculation ─────────────────────────────────────────────────

/**
 * Calculate month-over-month trend for a single KPI.
 * @param {object[]} monthlyData  - [{ period: '2026-01', value: 100 }, ...]
 * @param {string}   kpiId        - e.g. 'SC04'
 * @returns {KPITrend}
 */
export function calculateTrend(monthlyData, kpiId) {
  if (!monthlyData || monthlyData.length < 2) {
    return { kpi_id: kpiId, direction: 'flat', mom_pct: 0, ytd_total: 0, data: monthlyData || [] };
  }
  const sorted = [...monthlyData].sort((a, b) => a.period.localeCompare(b.period));
  const current = sorted[sorted.length - 1].value;
  const previous= sorted[sorted.length - 2].value;
  const mom_pct = previous !== 0 ? r2((current - previous) / Math.abs(previous)) : 0;
  const ytd     = r2(sorted.reduce((s, d) => s + (d.value || 0), 0));
  return {
    kpi_id:    kpiId,
    direction: mom_pct > 0.01 ? 'up' : mom_pct < -0.01 ? 'down' : 'flat',
    mom_pct,
    ytd_total: ytd,
    current,
    previous,
    data: sorted,
  };
}

/**
 * Group bookings by month and produce per-KPI trend series.
 * @param {object[]} bookings  - SC bookings
 * @param {string[]} kpiIds    - subset of SC KPI IDs to trend
 * @returns {object}           - { SC04: KPITrend, SC06: KPITrend, ... }
 */
export function buildSCTrends(bookings, kpiIds = ['SC01','SC04','SC06']) {
  // Group bookings by YYYY-MM
  const byMonth = {};
  for (const b of bookings) {
    const period = (b.service_date || b.created_at || '').slice(0, 7);
    if (!period) continue;
    if (!byMonth[period]) byMonth[period] = [];
    byMonth[period].push(b);
  }

  const trends = {};
  for (const kid of kpiIds) {
    const monthly = Object.entries(byMonth).map(([period, bks]) => {
      const actuals = calculateSCKPIs(bks, {});
      return { period, value: actuals[kid] ?? 0 };
    });
    trends[kid] = calculateTrend(monthly, kid);
  }
  return trends;
}

// ─── Full Dashboard ────────────────────────────────────────────────────

export function generateKPIDashboard(bookings, transactions, config, targets) {
  const scActuals = calculateSCKPIs(bookings, config);
  const fiActuals = calculateFinancialKPIs(transactions);
  const scorecard = buildScorecard(scActuals, fiActuals, targets);
  const trends    = buildSCTrends(bookings, ['SC01','SC04','SC06','SC08']);
  return { scorecard, trends, period: new Date().toISOString().slice(0, 7) };
}

// ─── Utilities ─────────────────────────────────────────────────────────

function r2(n)           { return Math.round((parseFloat(n) || 0) * 100) / 100; }
function sum(arr, fn)    { return arr.reduce((s, x) => s + (fn(x) || 0), 0); }