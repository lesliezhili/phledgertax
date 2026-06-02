# PHLedger — Free Open-Source Payment + Invoicing Platform

**Replaces Stripe + Xero completely. Zero transaction fees.**

## What It Does

| Feature | Replaces | Monthly Savings |
|---------|----------|-----------------|
| PayTo payments (NPP real-time) | Stripe (1.7% + 30c/tx) | ~$2,000+ |
| Native invoicing + ledger | Xero ($27-78/month) | ~$50+ |
| Escrow + split payments | Stripe Connect (0.5% + fees) | ~$500+ |
| BAS/GST reports | Xero BAS module | included |
| **Total** | | **$2,500+/month** |

## Architecture

```
Customer Bank ──PayTo──→ Platform Escrow ──PayTo──→ Provider Bank
                              │
                         PHLedger DB
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                Invoices  Journals  BAS/GST
```

## API Endpoints

| Endpoint | Replaces | Description |
|----------|----------|-------------|
| `POST /api/pay` | `stripe.paymentIntents.create()` | Initiate payment via PayTo |
| `POST /api/invoice` | `POST /api.xero.com/Invoices` | Create invoice + journal entry |
| `POST /api/payout` | Stripe Connect transfer | Release escrow to provider |
| `GET /api/status` | - | Health + cost comparison |

## Integration with SilverConnect

```typescript
// BEFORE (Stripe + Xero = $2,500/month)
const pi = await stripe.paymentIntents.create({ amount: 11000, currency: "aud" });
const inv = await xero.invoices.create({ ... });

// AFTER (PHLedger = $0/month)
const pay = await fetch("https://phledger.vercel.app/api/pay", {
  method: "POST",
  body: JSON.stringify({ amount: 110, bookingId, customerBsb, customerAccount })
});
const inv = await fetch("https://phledger.vercel.app/api/invoice", {
  method: "POST", 
  body: JSON.stringify({ bookingId, totalAmount: 110, customerName })
});
```

## Payment Rails

### Australia (PayTo / NPP)
- **Real-time** settlement (< 1 second)
- **Zero fees** to platform (NPP is free infrastructure)
- Customer creates mandate → Platform pulls funds
- Provider paid instantly on service completion

### Canada (Interac e-Transfer)
- **$0.25/transaction** (vs Stripe $3.20)
- Settlement in minutes

### Fallback: Stripe
- For international card payments
- Only used when PayTo/Interac unavailable

## Cost Per $110 Booking

| Component | Stripe + Xero | PHLedger |
|-----------|---------------|----------|
| Payment processing | $2.17 | $0.00 |
| Invoice creation | $0.03 | $0.00 |
| Provider payout | $0.55 | $0.00 |
| **Total per booking** | **$2.75** | **$0.00** |

At 1,000 bookings/month: **Save $2,750/month ($33,000/year)**

## Getting Started

```bash
git clone https://github.com/lesliezhili/phledgertax
npm install
npm test          # Run all tests
npm run dev       # Start API server (localhost:3000)
```

## License

MIT — Free and open source forever.
