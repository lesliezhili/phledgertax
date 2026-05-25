// lib/platformFee.js
// Generic Service Platform Fee Engine
// Supports any marketplace connecting service providers with clients.
// Used by: SilverConnect Global, and any future platform registered in platformRegistry.
//
// Key design principle: ALL fee rates and cancellation policies come from
// the UPSTREAM SYSTEM config. PHLedger never hardcodes percentages — it
// reads them from config at every calculation, making this engine platform-agnostic.
//
// Account codes used in PHLedger COA (shared across all platforms):
//   210  Platform Fee Revenue       INCOME
//   211  Booking Gross Revenue      INCOME
//   212  Cancellation Fee Income    INCOME
//   820  Service Provider Payables  LIABILITY
//   821  Refunds Payable            LIABILITY
//   450  Refunds Expense            EXPENSE
//   451  Provider Clawback Offset   EXPENSE (credit)

// ─── Default config (used when upstream has not yet synced) ────────────
export const DEFAULT_PLATFORM_CONFIG = {
  platform_id:       'default',
  platform_name:     'Service Platform',
  platform_fee_rate:  0.15,          // 15% retained by platform
  provider_rate:      0.85,          // 85% paid to service provider
  currency:          'AUD',
  gst_rate:           0.10,          // AU GST included in gross amount
  cancellation_policy: {
    full_refund_hours:    24,
    partial_refund_hours:  2,
    partial_refund_rate:   0.50,
    no_show_refund_rate:   0.00,
    platform_fee_refundable: true,
    cancellation_fee_rate:  0.05,
  },
  last_updated:     new Date().toISOString().slice(0, 10),
  upstream_source:  null,
  upstream_synced:  false,
};

// ─── Fee Calculation ────────────────────────────────────────────────────

/**
 * Split a booking gross amount into platform fee + provider payout.
 * All rates come from config (upstream system).
 *
 * @param {number} grossAmount
 * @param {object} config  — platform config from upstream system
 * @returns {FeeBreakdown}
 */
export function calculateFees(grossAmount, config = DEFAULT_PLATFORM_CONFIG) {
  const r        = parseFloat(config.platform_fee_rate) || 0.15;
  const gross    = round2(parseFloat(grossAmount) || 0);
  const gstRate  = parseFloat(config.gst_rate) || 0;

  const platformFee    = round2(gross * r);
  const providerPayout = round2(gross - platformFee);

  const gstOnGross  = gstRate > 0 ? round2(gross * gstRate / (1 + gstRate)) : 0;
  const gstOnFee    = gstRate > 0 ? round2(platformFee * gstRate / (1 + gstRate)) : 0;
  const netFeeExGst = round2(platformFee - gstOnFee);

  return {
    gross_amount:    gross,
    platform_fee:    platformFee,
    provider_payout: providerPayout,
    gst_on_gross:    gstOnGross,
    gst_on_fee:      gstOnFee,
    net_fee_ex_gst:  netFeeExGst,
    platform_fee_rate: r,
    provider_rate:   parseFloat(config.provider_rate) || round2(1 - r),
    currency:        config.currency || 'AUD',
  };
}

// ─── Cancellation / Refund ──────────────────────────────────────────────

/**
 * Calculate the refund breakdown for a cancelled booking.
 * Refund tier is determined by hoursNotice + upstream cancellation_policy.
 * Pass hoursNotice=null when the upstream system has not yet decided.
 *
 * @param {object} booking      — SCBooking / PlatformBooking record
 * @param {number|null} hoursNotice
 * @param {object} config
 * @returns {RefundBreakdown}
 */
export function calculateRefund(booking, hoursNotice, config = DEFAULT_PLATFORM_CONFIG) {
  const policy = config.cancellation_policy || DEFAULT_PLATFORM_CONFIG.cancellation_policy;
  const gross  = round2(parseFloat(booking.gross_amount) || 0);
  const fee    = round2(parseFloat(booking.platform_fee) || gross * (config.platform_fee_rate || 0.15));

  // Pending upstream decision
  if (hoursNotice === null || hoursNotice === undefined) {
    return {
      booking_id:           booking.booking_id,
      refund_type:          'pending_upstream',
      client_refund:        null,
      cancellation_fee:     null,
      provider_clawback:    null,
      platform_fee_refund:  null,
      platform_retained:    null,
      journal_entries:      [],
    };
  }

  const hours = parseFloat(hoursNotice);

  // Full refund
  if (hours >= (policy.full_refund_hours || 24)) {
    const feeRefund = policy.platform_fee_refundable ? fee : 0;
    return _refundResult(booking.booking_id, 'full',
      gross, 0, gross - fee, feeRefund, 0, policy);
  }

  // Partial refund
  if (hours >= (policy.partial_refund_hours || 2)) {
    const partialRate = policy.partial_refund_rate || 0.50;
    const cancelFeeRate = policy.cancellation_fee_rate || 0;
    const clientRefund   = round2(gross * partialRate);
    const cancelFee      = round2(gross * cancelFeeRate);
    const providerClawback = round2((booking.provider_payout || gross - fee) * partialRate);
    const feeRefund      = policy.platform_fee_refundable ? round2(fee * partialRate) : 0;
    const retained       = round2(gross - clientRefund - cancelFee);
    return _refundResult(booking.booking_id, 'partial',
      clientRefund, cancelFee, providerClawback, feeRefund, retained, policy);
  }

  // No refund
  return _refundResult(booking.booking_id, 'none',
    0, 0, 0, 0, gross, policy);
}

function _refundResult(bookingId, type, clientRefund, cancelFee, clawback, feeRefund, retained, _policy) {
  return {
    booking_id:          bookingId,
    refund_type:         type,
    client_refund:       round2(clientRefund),
    cancellation_fee:    round2(cancelFee),
    provider_clawback:   round2(clawback),
    platform_fee_refund: round2(feeRefund),
    platform_retained:   round2(retained),
    journal_entries:     _refundJournal(bookingId, type, clientRefund, cancelFee, clawback, feeRefund),
  };
}

function _refundJournal(bookingId, type, clientRefund, cancelFee, clawback, feeRefund) {
  if (type === 'none') return [];
  const entries = [];
  const note = `Booking ${bookingId} — ${type} refund`;
  if (clientRefund > 0) {
    entries.push({ dr: 'Refunds Payable (821)',         cr: 'Cash / Bank',                   amount: clientRefund,   note });
  }
  if (feeRefund > 0) {
    entries.push({ dr: 'Platform Fee Revenue (210)',    cr: 'Refunds Payable (821)',           amount: feeRefund,     note });
  }
  if (clawback > 0) {
    entries.push({ dr: 'Service Provider Payables (820)', cr: 'Provider Clawback Offset (451)', amount: clawback,      note });
  }
  if (cancelFee > 0) {
    entries.push({ dr: 'Cash / Bank',                  cr: 'Cancellation Fee Income (212)',  amount: cancelFee,     note });
  }
  return entries;
}

// ─── Provider Payout Aggregation ────────────────────────────────────────

/**
 * Aggregate all bookings into per-provider payout summaries.
 * Clawbacks from refunded/cancelled bookings are deducted.
 *
 * @param {PlatformBooking[]} bookings
 * @param {object} config
 * @returns {ProviderPayout[]}
 */
export function generateProviderPayouts(bookings, config = DEFAULT_PLATFORM_CONFIG) {
  const map = {};

  for (const b of bookings) {
    const pid = b.provider_id || b.provider_name || 'unknown';
    if (!map[pid]) {
      map[pid] = {
        provider_id:      pid,
        booking_count:    0,
        completed_count:  0,
        cancelled_count:  0,
        gross_total:      0,
        payout_gross:     0,
        clawback_total:   0,
        net_payout:       0,
      };
    }
    const p = map[pid];
    p.booking_count++;
    p.gross_total    = round2(p.gross_total + (b.gross_amount || 0));
    p.payout_gross   = round2(p.payout_gross + (b.provider_payout || 0));

    if (b.status === 'completed') {
      p.completed_count++;
    } else if (b.status === 'cancelled' || b.status === 'refunded') {
      p.cancelled_count++;
      const clawback = b.refund?.provider_clawback || 0;
      p.clawback_total = round2(p.clawback_total + clawback);
    }
  }

  for (const p of Object.values(map)) {
    p.net_payout = round2(p.payout_gross - p.clawback_total);
  }

  return Object.values(map).sort((a, b) => b.net_payout - a.net_payout);
}

// ─── Platform P&L ───────────────────────────────────────────────────────

/**
 * Generate a platform-level P&L summary across all bookings.
 *
 * @param {PlatformBooking[]} bookings
 * @param {object} config
 * @returns {PlatformPL}
 */
export function generatePlatformPL(bookings, config = DEFAULT_PLATFORM_CONFIG) {
  let feeRevenue = 0, totalGross = 0, refundsIssued = 0, cancelFees = 0;
  let completedCount = 0, cancelledCount = 0;

  for (const b of bookings) {
    totalGross = round2(totalGross + (b.gross_amount || 0));
    if (b.status === 'completed') {
      feeRevenue = round2(feeRevenue + (b.platform_fee || 0));
      completedCount++;
    } else if (b.status === 'cancelled' || b.status === 'refunded') {
      cancelledCount++;
      const retained = b.refund?.platform_retained || 0;
      feeRevenue     = round2(feeRevenue + retained);
      const issued   = b.refund?.client_refund || 0;
      refundsIssued  = round2(refundsIssued + issued);
      cancelFees     = round2(cancelFees + (b.refund?.cancellation_fee || 0));
    }
  }

  const netRevenue = round2(feeRevenue + cancelFees);
  const effectiveRate = totalGross > 0 ? round2(netRevenue / totalGross) : 0;

  return {
    platform_id:           config.platform_id || 'default',
    platform_name:         config.platform_name || 'Service Platform',
    total_bookings:        bookings.length,
    completed_bookings:    completedCount,
    cancelled_bookings:    cancelledCount,
    total_gross_bookings:  totalGross,
    total_fee_revenue:     feeRevenue,
    total_cancellation_fees: cancelFees,
    total_refunds_issued:  refundsIssued,
    net_platform_revenue:  netRevenue,
    effective_fee_rate:    effectiveRate,
    currency:              config.currency || 'AUD',
  };
}

// ─── Upstream Config Merge ──────────────────────────────────────────────

/**
 * Deep-merge upstream platform config into the base config.
 * Upstream values always win. Used when upstream pushes new rates.
 *
 * @param {object} base      — stored config (or DEFAULT_PLATFORM_CONFIG)
 * @param {object} upstream  — payload from upstream API
 * @returns {object}         — merged config with upstream_synced=true
 */
export function applyUpstreamConfig(base, upstream) {
  if (!upstream) return base;
  const merged = { ...base, ...upstream };
  if (upstream.cancellation_policy) {
    merged.cancellation_policy = {
      ...base.cancellation_policy,
      ...upstream.cancellation_policy,
    };
  }
  merged.upstream_synced = true;
  merged.last_updated    = new Date().toISOString().slice(0, 10);
  return merged;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
