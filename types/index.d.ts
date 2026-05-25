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
