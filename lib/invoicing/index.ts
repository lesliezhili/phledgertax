/**
 * PHLedger Native Invoicing — Replaces Xero completely
 * 
 * Built-in:
 * - Invoice generation with sequential numbering
 * - Double-entry ledger (journal entries)
 * - GST calculation (AU 10%, CA 5%)
 * - BAS/GST return data generation
 * - PDF-ready invoice data
 * - Aging reports (30/60/90 days)
 * 
 * Storage: Supabase/Postgres (same DB as SilverConnect)
 * No external API dependency. Zero cost.
 */

export interface Invoice {
  id: string;
  number: string; // SC-INV-0001
  type: "sales" | "purchase" | "credit_note";
  contact: InvoiceContact;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: "AUD" | "CAD";
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceContact {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  abn?: string; // AU Business Number
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // 0.10 for 10% GST
  taxAmount: number;
  lineTotal: number;
  accountCode: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalLine[];
  source: "invoice" | "payment" | "manual" | "payout";
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  taxCode?: string;
}

// Chart of Accounts (simplified for marketplace)
export const ACCOUNTS = {
  // Assets
  "1-1000": "Bank Account (Platform)",
  "1-1100": "Bank Account (Escrow)",
  "1-2000": "Accounts Receivable",
  // Liabilities
  "2-1000": "Accounts Payable",
  "2-1100": "GST Collected",
  "2-1200": "GST Paid",
  "2-2000": "Provider Payouts Payable",
  // Revenue
  "4-1000": "Platform Fee Revenue",
  "4-1100": "Service Revenue (gross)",
  // Expenses
  "5-1000": "Provider Payouts",
  "5-1100": "Payment Processing Fees",
  "5-1200": "Bank Fees",
};

let invoiceCounter = 0;

/**
 * Create a new invoice
 */
export function createInvoice(
  type: "sales" | "purchase",
  contact: InvoiceContact,
  items: { description: string; quantity: number; unitPrice: number; taxRate?: number; accountCode?: string }[],
  currency: "AUD" | "CAD" = "AUD",
  dueInDays: number = 14,
  reference?: string
): Invoice {
  invoiceCounter++;
  const now = new Date();
  const taxRate = currency === "AUD" ? 0.10 : 0.05;

  const lineItems: InvoiceLineItem[] = items.map(item => {
    const rate = item.taxRate ?? taxRate;
    const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    const tax = Math.round(lineTotal * rate * 100) / 100;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: rate,
      taxAmount: tax,
      lineTotal,
      accountCode: item.accountCode || (type === "sales" ? "4-1100" : "5-1000"),
    };
  });

  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const taxAmount = lineItems.reduce((sum, li) => sum + li.taxAmount, 0);
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    id: `INV-${Date.now()}`,
    number: `SC-INV-${String(invoiceCounter).padStart(4, "0")}`,
    type,
    contact,
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total,
    amountPaid: 0,
    amountDue: total,
    currency,
    status: "draft",
    issueDate: now.toISOString().split("T")[0],
    dueDate: new Date(now.getTime() + dueInDays * 86400000).toISOString().split("T")[0],
    reference,
    createdAt: now.toISOString(),
  };
}

/**
 * Record payment against an invoice
 */
export function recordPayment(invoice: Invoice, amount: number): Invoice {
  const paid = Math.min(invoice.amountDue, amount);
  const newPaid = Math.round((invoice.amountPaid + paid) * 100) / 100;
  const newDue = Math.round((invoice.total - newPaid) * 100) / 100;
  return {
    ...invoice,
    amountPaid: newPaid,
    amountDue: newDue,
    status: newDue <= 0 ? "paid" : invoice.status,
    paidDate: newDue <= 0 ? new Date().toISOString().split("T")[0] : undefined,
  };
}

/**
 * Generate journal entry for a marketplace booking
 * Double-entry: Debit Bank/AR, Credit Revenue + GST + Payable
 */
export function bookingToJournal(
  bookingId: string,
  customerName: string,
  totalAmount: number,
  platformFee: number,
  gstOnFee: number,
  providerPayout: number,
  date: string
): JournalEntry {
  const gstOnService = Math.round(totalAmount / 11 * 100) / 100; // GST-inclusive ÷ 11

  return {
    id: `JE-${Date.now()}`,
    date,
    description: `Booking ${bookingId} — ${customerName}`,
    reference: bookingId,
    lines: [
      // Debit: Bank receives total from customer
      { accountCode: "1-1100", accountName: "Escrow Account", debit: totalAmount, credit: 0 },
      // Credit: GST collected (on full service amount)
      { accountCode: "2-1100", accountName: "GST Collected", debit: 0, credit: gstOnService },
      // Credit: Platform fee revenue (net of GST on fee)
      { accountCode: "4-1000", accountName: "Platform Fee Revenue", debit: 0, credit: Math.round((platformFee - gstOnFee) * 100) / 100 },
      // Credit: Provider payout payable
      { accountCode: "2-2000", accountName: "Provider Payouts Payable", debit: 0, credit: providerPayout },
      // Credit: Remaining to service revenue
      { accountCode: "4-1100", accountName: "Service Revenue", debit: 0, credit: Math.round((totalAmount - gstOnService - platformFee + gstOnFee - providerPayout) * 100) / 100 },
    ],
    source: "invoice",
  };
}

/**
 * Generate BAS data for a period
 */
export function generateBasReport(
  journals: JournalEntry[],
  periodFrom: string,
  periodTo: string
): { g1: number; g11: number; gst1a: number; gst1b: number; netGst: number; period: string } {
  let gstCollected = 0;
  let gstPaid = 0;
  let totalSales = 0;
  let totalPurchases = 0;

  for (const je of journals) {
    if (je.date < periodFrom || je.date > periodTo) continue;
    for (const line of je.lines) {
      if (line.accountCode === "2-1100") gstCollected += line.credit - line.debit;
      if (line.accountCode === "2-1200") gstPaid += line.debit - line.credit;
      if (line.accountCode.startsWith("4-")) totalSales += line.credit;
      if (line.accountCode.startsWith("5-")) totalPurchases += line.debit;
    }
  }

  return {
    g1: Math.round(totalSales * 100) / 100,
    g11: Math.round(totalPurchases * 100) / 100,
    gst1a: Math.round(gstCollected * 100) / 100,
    gst1b: Math.round(gstPaid * 100) / 100,
    netGst: Math.round((gstCollected - gstPaid) * 100) / 100,
    period: `${periodFrom} to ${periodTo}`,
  };
}

/**
 * Invoice aging report
 */
export function agingReport(invoices: Invoice[]): {
  current: number; days30: number; days60: number; days90plus: number; total: number;
} {
  const now = Date.now();
  let current = 0, days30 = 0, days60 = 0, days90plus = 0;

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "void") continue;
    const dueDate = new Date(inv.dueDate).getTime();
    const daysOverdue = Math.max(0, Math.floor((now - dueDate) / 86400000));
    
    if (daysOverdue === 0) current += inv.amountDue;
    else if (daysOverdue <= 30) days30 += inv.amountDue;
    else if (daysOverdue <= 60) days60 += inv.amountDue;
    else days90plus += inv.amountDue;
  }

  return {
    current: Math.round(current * 100) / 100,
    days30: Math.round(days30 * 100) / 100,
    days60: Math.round(days60 * 100) / 100,
    days90plus: Math.round(days90plus * 100) / 100,
    total: Math.round((current + days30 + days60 + days90plus) * 100) / 100,
  };
}
