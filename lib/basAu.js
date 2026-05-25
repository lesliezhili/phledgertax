// lib/basAu.js
export function generateBasDraft(transactions, startDate, endDate) {
  let sales=0, purchases=0, gstSales=0, gstPurchases=0;
  const start = startDate, end = endDate;
  for (const tx of transactions) {
    if (tx.date < start || tx.date > end) continue;
    if (tx.amount > 0) {
      sales += tx.amount;
      if (!['INPUT','EXEMPT','GST_FREE'].includes(tx.tax_code))
        gstSales += tx.amount * 0.1 / 1.1;
    } else {
      purchases += Math.abs(tx.amount);
      if (!['INPUT','EXEMPT','GST_FREE'].includes(tx.tax_code))
        gstPurchases += Math.abs(tx.amount) * 0.1 / 1.1;
    }
  }
  return {
    period_start: start, period_end: end,
    g1_total_sales: r(sales),
    g10_capital_purchases: 0,
    g11_non_capital_purchases: r(purchases),
    gst_on_sales_1a: r(gstSales),
    gst_on_purchases_1b: r(gstPurchases),
    net_gst_payable: r(gstSales - gstPurchases),
  };
}

export function generateQuarterlyBas(transactions, year) {
  const quarters = [
    { q:1, label:'Jul-Sep', start:`${year}-07-01`,    end:`${year}-09-30` },
    { q:2, label:'Oct-Dec', start:`${year}-10-01`,    end:`${year}-12-31` },
    { q:3, label:'Jan-Mar', start:`${year+1}-01-01`,  end:`${year+1}-03-31` },
    { q:4, label:'Apr-Jun', start:`${year+1}-04-01`,  end:`${year+1}-06-30` },
  ];
  return quarters.map(({ q, label, start, end }) => ({
    quarter: q, label, fy: `FY${year}-${String(year+1).slice(2)}`,
    period_start: start, period_end: end,
    ...generateBasDraft(transactions, start, end),
  }));
}

function r(n) { return Math.round(n * 100) / 100; }
