/**
 * POST /api/invoice — Create invoice (replaces Xero)
 * 
 * SilverConnect calls this instead of Xero API
 * 
 * Request: { bookingId, customerName, customerEmail, serviceName, duration, totalAmount, basePrice, gstAmount }
 * Response: { invoiceId, invoiceNumber, total, status, viewUrl }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { createInvoice, bookingToJournal } from "../../lib/invoicing";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { bookingId, customerName, customerEmail, serviceName, duration,
    totalAmount, basePrice, gstAmount, platformFee, providerPayout } = req.body;

  if (!bookingId || !totalAmount) {
    return res.status(400).json({ error: "bookingId and totalAmount required" });
  }

  // 1. Create sales invoice
  const invoice = createInvoice(
    "sales",
    { name: customerName || "Customer", email: customerEmail || "" },
    [{
      description: `${serviceName || "Service"} — ${duration || 60} min`,
      quantity: 1,
      unitPrice: basePrice || totalAmount / 1.10,
      taxRate: 0.10,
    }],
    "AUD",
    14,
    `Booking ${bookingId}`
  );

  // 2. Create journal entry (double-entry accounting)
  const journal = bookingToJournal(
    bookingId,
    customerName || "Customer",
    totalAmount,
    platformFee || totalAmount * 0.15,
    (platformFee || totalAmount * 0.15) * 0.10,
    providerPayout || totalAmount * 0.85,
    new Date().toISOString().split("T")[0]
  );

  return res.status(200).json({
    success: true,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    total: invoice.total,
    taxAmount: invoice.taxAmount,
    status: "draft",
    journalId: journal.id,
    viewUrl: `/invoices/${invoice.id}`,
    note: "Invoice created in PHLedger (no Xero dependency)",
    costSavings: {
      xeroWouldCost: "$27/month (Starter plan)",
      phledgerCosts: "$0 (open-source)",
    },
  });
}
