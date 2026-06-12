// lib/phledger/finance.ts -- PHledger finance automation: escrow ledger + settlement.
export interface BookingLedgerRow {
  bookingId: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  customerTotal: number
  net: number
  gst: number
  platformFee: number
  providerPayout: number
  discountTotal: number
  sustainabilityRebate?: number
  fundingScheme?: string
}

export interface FinanceSummary {
  bookings: number
  grossRevenue: number
  netRevenue: number
  gstCollected: number
  platformFees: number
  escrowHeld: number
  payoutsDue: number
  discountsGiven: number
  sustainabilityRebatePool: number
  byScheme: Record<string, number>
}

export function summarizeFinance(rows: BookingLedgerRow[]): FinanceSummary {
  const s: FinanceSummary = {
    bookings: rows.length, grossRevenue: 0, netRevenue: 0, gstCollected: 0,
    platformFees: 0, escrowHeld: 0, payoutsDue: 0, discountsGiven: 0,
    sustainabilityRebatePool: 0, byScheme: {},
  }
  for (const r of rows) {
    if (r.status === 'cancelled') continue
    s.grossRevenue += r.customerTotal
    s.netRevenue += r.net
    s.gstCollected += r.gst
    s.platformFees += r.platformFee
    s.discountsGiven += r.discountTotal
    s.sustainabilityRebatePool += r.sustainabilityRebate ?? 0
    if (r.status === 'completed') s.payoutsDue += r.providerPayout
    else s.escrowHeld += r.providerPayout
    const k = r.fundingScheme ?? 'private'
    s.byScheme[k] = Number(((s.byScheme[k] ?? 0) + r.customerTotal).toFixed(2))
  }
  const sr = s as unknown as Record<string, number>
  const keys = ['grossRevenue', 'netRevenue', 'gstCollected', 'platformFees',
    'escrowHeld', 'payoutsDue', 'discountsGiven', 'sustainabilityRebatePool']
  for (const k of keys) sr[k] = Number(sr[k].toFixed(2))
  return s
}

export function autoReleaseEscrow(row: BookingLedgerRow): { release: boolean; amount: number } {
  const done = row.status === 'completed'
  return { release: done, amount: done ? row.providerPayout : 0 }
}
