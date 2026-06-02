import type { NextApiRequest, NextApiResponse } from "next";
import { costComparison } from "../../lib/payments/payto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const savings100 = costComparison(100);
  const savings1000 = costComparison(1000);
  
  return res.status(200).json({
    service: "PHLedger Payment + Invoicing Platform",
    version: "1.0.0",
    status: "operational",
    replaces: ["Stripe ($2,000+/month for marketplace)", "Xero ($27-78/month)"],
    totalMonthlySavings: "$2,100+ (for 1000 transactions/month)",
    endpoints: {
      "POST /api/pay": "Create payment (replaces Stripe PaymentIntent)",
      "POST /api/invoice": "Create invoice (replaces Xero)",
      "POST /api/payout": "Release escrow to provider (replaces Stripe Connect)",
      "GET /api/status": "This endpoint",
    },
    costPerTransaction: {
      "$100_booking": { stripe: `$${savings100.stripe}`, phledger: "$0.00", savings: `$${savings100.savings}` },
      "$1000_booking": { stripe: `$${savings1000.stripe}`, phledger: "$0.00", savings: `$${savings1000.savings}` },
    },
    paymentRails: {
      AU: "PayTo (NPP) — real-time, zero fees",
      CA: "Interac e-Transfer — $0.25/tx",
      fallback: "Stripe (if card payment required)",
    },
  });
}
