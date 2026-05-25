// lib/taxCa.js
export function draftCaCorporateTax(year, transactions) {
  const income   = transactions.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const taxable  = Math.max(0, income - expenses);
  const fed = r(taxable * 0.09), prov = r(taxable * 0.08);
  return { year, taxable_income: r(taxable), federal_tax: fed, provincial_tax: prov, total_tax: r(fed+prov),
           notes: ['9% federal SBD rate', '~8% avg provincial', 'Active business income < $500K'] };
}

export function draftCaPersonalTax(year, transactions) {
  const income = transactions.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  let fed = 0;
  if      (income <= 55867)  fed = income * 0.15;
  else if (income <= 111733) fed = 8380.05  + (income - 55867)  * 0.205;
  else if (income <= 154906) fed = 19822.36 + (income - 111733) * 0.26;
  else if (income <= 220000) fed = 31047.72 + (income - 154906) * 0.29;
  else                       fed = 49929.43 + (income - 220000) * 0.33;
  fed = Math.max(0, fed - 15705 * 0.15);
  const prov = r(income * 0.09);
  return { year, taxable_income: r(income), federal_tax: r(fed), provincial_tax: prov, total_tax: r(r(fed)+prov),
           notes: ['2024 federal brackets', 'Basic Personal Amount credit applied', '~9% avg provincial'] };
}

export function generateQuarterlyGst(year, quarter, transactions) {
  const q_txs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && Math.floor(d.getMonth() / 3) + 1 === quarter;
  });
  const sales     = q_txs.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const purchases = q_txs.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const collected = r(sales * 5 / 21), paid = r(purchases * 5 / 21);
  return { quarter, year, gst_collected: collected, gst_paid: paid, net_gst: r(collected - paid),
           notes: ['5% GST rate', 'GST extracted using divisor 21'] };
}

export function generateAnnualHst(year, transactions) {
  const quarters = [1,2,3,4].map(q => generateQuarterlyGst(year, q, transactions));
  const total_collected = r(quarters.reduce((s,q) => s + q.gst_collected, 0));
  const total_paid      = r(quarters.reduce((s,q) => s + q.gst_paid, 0));
  return { year, quarters, annual_gst_collected: total_collected, annual_gst_paid: total_paid,
           annual_net_gst: r(total_collected - total_paid),
           hst_provincial_note: 'HST rates vary: ON=15%, BC=12%, NS/NB/NL/PEI=15%. Consult CRA.' };
}

function r(n) { return Math.round(n * 100) / 100; }
