/**
 * PHLedger × SilverConnect Integration Test
 * Tests full payment + invoicing flow without Stripe/Xero
 */
import { initiatePayment, createEscrow, releaseEscrow, costComparison } from "../lib/payments/payto";
import { createInvoice, recordPayment, bookingToJournal, generateBasReport } from "../lib/invoicing";

describe("PHLedger replaces Stripe + Xero for SilverConnect", () => {
  
  test("PayTo payment replaces Stripe PaymentIntent", () => {
    const payment = initiatePayment("062-123", "123456789", "Margaret Chen", 110, "SC-BOOK-001", true);
    expect(payment.status).toBe("settled");
    expect(payment.amount).toBe(110);
    expect(payment.nppTransactionId).toContain("NPP-SIM");
    expect(payment.currency).toBe("AUD");
  });

  test("Escrow holds funds like Stripe Connect", () => {
    const escrow = createEscrow("PAY-1", "BOOK-001", 110, 15, 0.10, "062-456", "987654321", "Sarah Johnson", 48);
    expect(escrow.totalAmount).toBe(110);
    expect(escrow.platformFee).toBe(16.5);
    expect(escrow.providerPayout).toBe(93.5);
    expect(escrow.status).toBe("held");
  });

  test("Escrow release pays provider instantly via PayTo", () => {
    const escrow = createEscrow("PAY-1", "BOOK-001", 110, 15, 0.10, "062-456", "987654321", "Sarah Johnson", 0);
    const { escrow: released, providerPayment } = releaseEscrow(escrow, true);
    expect(released.status).toBe("released");
    expect(providerPayment.amount).toBe(93.5);
    expect(providerPayment.status).toBe("settled");
    expect(providerPayment.toName).toBe("Sarah Johnson");
  });

  test("Native invoice replaces Xero", () => {
    const invoice = createInvoice(
      "sales",
      { name: "Margaret Chen", email: "margaret@test.com" },
      [{ description: "Cleaning — 120 min", quantity: 1, unitPrice: 100, taxRate: 0.10 }],
      "AUD", 14, "BOOK-001"
    );
    expect(invoice.number).toMatch(/^SC-INV-/);
    expect(invoice.subtotal).toBe(100);
    expect(invoice.taxAmount).toBe(10);
    expect(invoice.total).toBe(110);
    expect(invoice.status).toBe("draft");
  });

  test("Payment recording marks invoice paid", () => {
    const invoice = createInvoice(
      "sales",
      { name: "Margaret Chen", email: "margaret@test.com" },
      [{ description: "Cleaning", quantity: 1, unitPrice: 100, taxRate: 0.10 }],
      "AUD"
    );
    const paid = recordPayment(invoice, 110);
    expect(paid.status).toBe("paid");
    expect(paid.amountDue).toBe(0);
  });

  test("Journal entry creates proper double-entry accounting", () => {
    const journal = bookingToJournal("BOOK-001", "Margaret Chen", 110, 16.5, 1.65, 93.5, "2026-06-02");
    expect(journal.lines.length).toBeGreaterThan(0);
    // Double-entry: total debits = total credits
    const debits = journal.lines.reduce((s, l) => s + l.debit, 0);
    const credits = journal.lines.reduce((s, l) => s + l.credit, 0);
    expect(Math.round(debits * 100)).toBe(Math.round(credits * 100));
  });

  test("Cost savings: $0 vs Stripe $2.17 per $110 booking", () => {
    const savings = costComparison(110);
    expect(savings.payto).toBe(0);
    expect(savings.stripe).toBeGreaterThan(2);
    expect(savings.savings).toBeGreaterThan(2);
  });

  test("Full E2E: Booking → Payment → Invoice → Payout (no Stripe, no Xero)", () => {
    // Step 1: Customer pays via PayTo
    const payment = initiatePayment("062-123", "123456789", "Margaret Chen", 110, "SC-BOOK-E2E", true);
    expect(payment.status).toBe("settled");

    // Step 2: Create escrow
    const escrow = createEscrow(payment.id, "BOOK-E2E", 110, 15, 0.10, "062-456", "987654321", "Sarah Johnson", 48);
    expect(escrow.status).toBe("held");

    // Step 3: Create invoice (no Xero API call)
    const invoice = createInvoice("sales", { name: "Margaret Chen", email: "m@test.com" },
      [{ description: "Cleaning/regular — 120 min", quantity: 1, unitPrice: 100 }], "AUD", 14, "BOOK-E2E");
    expect(invoice.total).toBe(110);

    // Step 4: Service completes → release escrow
    const { escrow: released, providerPayment } = releaseEscrow(escrow, true);
    expect(released.status).toBe("released");
    expect(providerPayment.amount).toBe(93.5);

    // Step 5: Record payment on invoice
    const paidInvoice = recordPayment(invoice, 110);
    expect(paidInvoice.status).toBe("paid");

    // Step 6: Journal entry for books
    const journal = bookingToJournal("BOOK-E2E", "Margaret Chen", 110, 16.5, 1.65, 93.5, "2026-06-02");
    const debits = journal.lines.reduce((s, l) => s + l.debit, 0);
    const credits = journal.lines.reduce((s, l) => s + l.credit, 0);
    expect(Math.abs(debits - credits)).toBeLessThan(0.01);

    // RESULT: Full flow, zero external dependencies, zero transaction fees
  });
});
