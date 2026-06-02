/**
 * POST /api/pay — Create payment (replaces Stripe)
 * 
 * SilverConnect calls this instead of stripe.paymentIntents.create()
 * 
 * Request: { amount, currency, customerBsb, customerAccount, customerName, bookingId, providerBsb, providerAccount, providerName }
 * Response: { paymentId, escrowId, status, breakdown }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { initiatePayment, createEscrow } from "../../lib/payments/payto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { amount, currency, customerBsb, customerAccount, customerName, bookingId,
    providerBsb, providerAccount, providerName, platformFeePercent = 15, testMode = true } = req.body;

  if (!amount || !bookingId) {
    return res.status(400).json({ error: "amount and bookingId required" });
  }

  // 1. Initiate PayTo payment (pull from customer)
  const payment = initiatePayment(
    customerBsb || "000-000",
    customerAccount || "000000000",
    customerName || "Test Customer",
    amount,
    `SC-${bookingId}`,
    testMode
  );

  // 2. Create escrow hold
  const gstRate = currency === "CAD" ? 0.05 : 0.10;
  const escrow = createEscrow(
    payment.id,
    bookingId,
    amount,
    platformFeePercent,
    gstRate,
    providerBsb || "000-000",
    providerAccount || "000000000",
    providerName || "Test Provider",
    48 // hold for 48 hours
  );

  return res.status(200).json({
    success: true,
    paymentId: payment.id,
    escrowId: escrow.id,
    nppTransactionId: payment.nppTransactionId,
    status: payment.status,
    breakdown: {
      customerPaid: amount,
      platformFee: escrow.platformFee,
      platformGst: escrow.platformGst,
      providerPayout: escrow.providerPayout,
      escrowReleaseAt: escrow.releaseAt,
    },
    costSavings: {
      stripeWouldCharge: Math.round((amount * 0.017 + 0.30) * 100) / 100,
      phledgerCharges: 0,
      youSave: Math.round((amount * 0.017 + 0.30) * 100) / 100,
    },
    message: testMode ? "TEST MODE — simulated instant settlement" : "Payment initiated via PayTo NPP",
  });
}
