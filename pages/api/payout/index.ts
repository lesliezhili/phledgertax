/**
 * POST /api/payout — Release escrow & pay provider (replaces Stripe Connect)
 * 
 * Request: { escrowId, bookingId }
 * Response: { payoutId, providerAmount, status }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { createEscrow, releaseEscrow } from "../../lib/payments/payto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { bookingId, totalAmount, providerBsb, providerAccount, providerName,
    platformFeePercent = 15, testMode = true } = req.body;

  if (!bookingId || !totalAmount) {
    return res.status(400).json({ error: "bookingId and totalAmount required" });
  }

  // Recreate escrow (in production, would fetch from DB)
  const escrow = createEscrow(
    `PAY-SIM-${Date.now()}`,
    bookingId,
    totalAmount,
    platformFeePercent,
    0.10,
    providerBsb || "062-000",
    providerAccount || "987654321",
    providerName || "Provider",
    0
  );

  // Release escrow → pay provider
  const { escrow: released, providerPayment } = releaseEscrow(escrow, testMode);

  return res.status(200).json({
    success: true,
    payoutId: providerPayment.id,
    providerAmount: released.providerPayout,
    platformFee: released.platformFee,
    nppTransactionId: providerPayment.nppTransactionId,
    status: providerPayment.status,
    settledAt: providerPayment.settledAt,
    message: testMode ? "TEST: Instant payout simulated via PayTo" : "Payout sent via NPP real-time",
  });
}
