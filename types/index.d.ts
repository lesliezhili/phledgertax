// types/index.d.ts — PHLedger shared TypeScript types

export interface Transaction {
  id: string;
  date: string;           // ISO date string YYYY-MM-DD
  description: string;
  amount: number;
  currency: 'AUD' | 'CAD';
  bank?: string;
  account_code?: string;
  tax_code?: string;
  category?: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';
}

export interface ClassificationRule {
  pattern: RegExp;
  account_code: string;
  tax_code: string;
}

export interface BASDraft {
  period_start: string;
  period_end: string;
  g1_total_sales: number;
  g10_capital_purchases: number;
  g11_non_capital_purchases: number;
  gst_on_sales_1a: number;
  gst_on_purchases_1b: number;
  net_gst_payable: number;
}

export interface QuarterlyBAS extends BASDraft {
  quarter: number;
  label: string;
  fy: string;
}

export interface TaxDraftAU {
  year: number;
  taxable_income: number;
  tax_payable: number;
  medicare_levy?: number;
  notes: string[];
}

export interface TaxDraftCA {
  year: number;
  taxable_income: number;
  federal_tax: number;
  provincial_tax: number;
  total_tax: number;
  notes: string[];
}

export interface QuarterlyGST {
  quarter: number;
  year: number;
  gst_collected: number;
  gst_paid: number;
  net_gst: number;
  notes: string[];
}

export interface AnnualHST {
  year: number;
  quarters: QuarterlyGST[];
  annual_gst_collected: number;
  annual_gst_paid: number;
  annual_net_gst: number;
  hst_provincial_note: string;
}

export interface BalanceSheet {
  assets: { cash: number };
  liabilities: Record<string, number>;
  equity: { retained_earnings: number };
}

export interface ProfitLoss {
  revenue: number;
  expenses: number;
  net_income: number;
}

export interface CashFlow {
  operating: number;
  investing: number;
  financing: number;
  net_change: number;
}

export interface FinancialStatements {
  as_of_date: string;
  balance_sheet: BalanceSheet;
  profit_loss: ProfitLoss;
  cash_flow: CashFlow;
  banks_included?: string[];
}

export interface AnalyticsResult {
  country: string;
  banks_included: string[];
  total_transactions: number;
  total_income: number;
  total_expenses: number;
  net: number;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  version: string;
  framework: string;
  backend: 'csv' | 'supabase';
  au_banks: string[];
  ca_banks: string[];
}

export interface ChatResponse {
  message: string;
  data?: Record<string, unknown>;
}

export type Country = 'AU' | 'CA' | 'ALL';
export type BankCode = 'anz' | 'nab' | 'cba' | 'westpac' | 'rbc' | 'td' | 'bmo' | 'scotiabank' | 'cibc';

// ─── SilverConnect Global — Platform Fee Types ───────────────────────

export interface PlatformCancellationPolicy {
  full_refund_hours:       number;    // >= N hours notice → full refund
  partial_refund_hours:    number;    // >= N hours notice → partial refund
  partial_refund_rate:     number;    // fraction of gross returned (0–1)
  no_show_refund_rate:     number;    // 0 = no refund for no-show
  platform_fee_refundable: boolean;   // whether platform fee is refunded
  cancellation_fee_rate:   number;    // admin fee deducted from refund
}

export interface PlatformConfig {
  platform_name:       string;
  platform_fee_rate:   number;        // e.g. 0.15 — from upstream system
  provider_rate:       number;        // e.g. 0.85 — from upstream system
  currency:            'AUD' | 'CAD' | 'CNY';
  gst_rate:            number;
  cancellation_policy: PlatformCancellationPolicy;
  last_updated:        string;
  upstream_source:     string;        // 'silverconnect-global'
  upstream_synced:     boolean;
}

export interface FeeBreakdown {
  gross_amount:      number;
  platform_fee_rate: number;
  platform_fee:      number;
  provider_rate:     number;
  provider_payout:   number;
  gst_on_gross:      number;
  gst_on_fee:        number;
  net_fee_ex_gst:    number;
  currency:          string;
}

export interface RefundBreakdown {
  booking_id:          string;
  gross_amount:        number;
  hours_notice:        number | null;
  refund_type:         'full' | 'partial' | 'none' | 'pending_upstream';
  refund_rate:         number;
  client_refund:       number;
  cancellation_fee:    number;
  provider_clawback:   number;
  platform_fee_refund: number;
  platform_retained:   number;
  status:              'CALCULATED' | 'PENDING';
  journal_entries:     JournalEntry[];
}

export interface JournalEntry {
  dr:     string;
  cr:     string;
  amount: number;
  note:   string;
}

export interface SCBooking {
  booking_id:         string;
  client_name:        string;
  provider_id:        string;
  provider_name:      string;
  gross_amount:       number;
  platform_fee:       number;
  provider_payout:    number;
  service_date:       string;
  service_type:       string;
  status:             'completed' | 'cancelled' | 'refunded' | 'pending_refund';
  created_at:         string;
  notes?:             string;
  currency:           string;
  fee_rate_applied:   number;
  refund?:            RefundBreakdown;
}

export interface ProviderPayout {
  provider_id:        string;
  provider_name:      string;
  booking_count:      number;
  completed_count:    number;
  cancelled_count:    number;
  gross_total:        number;
  platform_fee_total: number;
  payout_gross:       number;
  clawback_total:     number;
  net_payout:         number;
  currency:           string;
}

export interface PlatformPL {
  period:                   string;
  platform_fee_rate:        number;
  provider_rate:            number;
  currency:                 string;
  total_gross_bookings:     number;
  total_fee_revenue:        number;
  total_provider_payouts:   number;
  total_refunds_issued:     number;
  total_clawbacks:          number;
  total_cancellation_fees:  number;
  net_platform_revenue:     number;
  booking_counts:           { completed: number; cancelled: number; pending: number; total: number };
  effective_fee_rate:       number;
}
