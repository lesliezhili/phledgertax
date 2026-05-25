// lib/categoriser.js
export const DEFAULT_COA = [
  { code: '200', name: 'Sales Revenue',          type: 'INCOME' },
  { code: '201', name: 'Service Revenue',         type: 'INCOME' },
  { code: '202', name: 'Other Income',            type: 'INCOME' },
  { code: '400', name: 'Office Expenses',         type: 'EXPENSE' },
  { code: '401', name: 'Software Subscriptions',  type: 'EXPENSE' },
  { code: '402', name: 'Travel & Accommodation',  type: 'EXPENSE' },
  { code: '403', name: 'Advertising & Marketing', type: 'EXPENSE' },
  { code: '404', name: 'Telecommunications',      type: 'EXPENSE' },
  { code: '405', name: 'Accounting & Legal',      type: 'EXPENSE' },
  { code: '406', name: 'Bank Fees',               type: 'EXPENSE' },
  { code: '407', name: 'Meals & Entertainment',   type: 'EXPENSE' },
  { code: '408', name: 'Utilities',               type: 'EXPENSE' },
  { code: '409', name: 'Rent & Lease',            type: 'EXPENSE' },
  { code: '410', name: 'Insurance',               type: 'EXPENSE' },
  { code: '411', name: 'Wages & Salaries',        type: 'EXPENSE' },
  { code: '412', name: 'Contractors',             type: 'EXPENSE' },
  { code: '413', name: 'Superannuation',          type: 'EXPENSE' },
  { code: '414', name: 'Motor Vehicle',           type: 'EXPENSE' },
  { code: '415', name: 'Depreciation',            type: 'EXPENSE' },
  { code: '499', name: 'Uncategorised Expense',   type: 'EXPENSE' },
  { code: '600', name: 'Cash at Bank',            type: 'ASSET' },
  { code: '601', name: 'Accounts Receivable',     type: 'ASSET' },
  { code: '800', name: 'Accounts Payable',        type: 'LIABILITY' },
  { code: '801', name: 'GST Payable',             type: 'LIABILITY' },
  { code: '900', name: 'Retained Earnings',       type: 'EQUITY' },
  // ─── SilverConnect Global ─────────────────────────────────────────────
  { code: '210', name: 'SC Platform Fee Revenue',      type: 'INCOME'    },
  { code: '211', name: 'SC Booking Gross Revenue',     type: 'INCOME'    },
  { code: '212', name: 'SC Cancellation Fee Income',   type: 'INCOME'    },
  { code: '820', name: 'SC Provider Payables',         type: 'LIABILITY' },
  { code: '821', name: 'SC Refunds Payable',           type: 'LIABILITY' },
  { code: '450', name: 'SC Refunds Expense',           type: 'EXPENSE'   },
  { code: '451', name: 'SC Provider Clawback Offset',  type: 'EXPENSE'   },
  { code: '901', name: 'Owner Equity',            type: 'EQUITY' },
];

export const DEFAULT_RULES = [
  { pattern: /uber\s*eats|ubereats/i,                                          account_code: '407', tax_code: 'GST' },
  { pattern: /uber|lyft|taxi|\bcab\b/i,                                        account_code: '402', tax_code: 'GST' },
  { pattern: /client|invoice|payment received/i,                               account_code: '200', tax_code: 'GST_ON_INCOME' },
  { pattern: /airbnb|hotel|accommodation|motel/i,                              account_code: '402', tax_code: 'GST' },
  { pattern: /qantas|virgin australia|jetstar|air canada|westjet|flight|airline/i, account_code: '402', tax_code: 'GST' },
  { pattern: /netflix|spotify|github|aws|azure|google cloud|atlassian|slack|zoom|dropbox/i, account_code: '401', tax_code: 'GST' },
  { pattern: /woolworths|coles|aldi|iga|safeway|metro|loblaws|sobeys|grocery/i, account_code: '407', tax_code: 'GST' },
  { pattern: /restaurant|cafe|coffee|mcdonald|kfc|subway|pizza|sushi|bakery|hungry jacks|tim hortons|starbucks/i, account_code: '407', tax_code: 'GST' },
  { pattern: /telstra|optus|vodafone|tpg|rogers|bell canada|telus|mobile|internet|broadband/i, account_code: '404', tax_code: 'GST' },
  { pattern: /bank fee|monthly fee|account fee|atm fee|overdraft/i,            account_code: '406', tax_code: 'INPUT' },
  { pattern: /insurance|allianz|nrma|aami|suncorp|sun life|manulife/i,        account_code: '410', tax_code: 'GST' },
  { pattern: /rent|lease|real estate|property management/i,                    account_code: '409', tax_code: 'GST' },
  { pattern: /salary|payroll|wages|super|superannuation|ato|cra|hst|payg/i,   account_code: '411', tax_code: 'INPUT' },
  { pattern: /contractor|freelance|consultant/i,                               account_code: '412', tax_code: 'GST' },
  { pattern: /fuel|petrol|bp|shell|ampol|caltex|esso|chevron/i,               account_code: '414', tax_code: 'GST' },
  { pattern: /power|electricity|water|\bgas\b|energy australia|origin energy|agl/i, account_code: '408', tax_code: 'GST' },
  // ─── SilverConnect Global ─────────────────────────────────────────────
  { pattern: /silverconnect|sc platform fee|booking fee/i,    account_code: '210', tax_code: 'GST_ON_INCOME' },
  { pattern: /provider payout|carer payment|provider payment/i, account_code: '820', tax_code: 'INPUT' },
  { pattern: /sc cancellation|booking cancelled|cancellation fee/i, account_code: '212', tax_code: 'GST_ON_INCOME' },
  { pattern: /sc refund|booking refund/i,                     account_code: '450', tax_code: 'GST' },
];

const COA_MAP = Object.fromEntries(DEFAULT_COA.map(a => [a.code, a.name]));

export function autoCategorise(transactions, rules = DEFAULT_RULES) {
  return transactions.map(tx => {
    const t = { ...tx };
    let matched = false;
    for (const rule of rules) {
      if (rule.pattern.test(t.description)) {
        t.account_code = rule.account_code;
        t.tax_code = rule.tax_code;
        t.category = COA_MAP[rule.account_code] || 'Unknown';
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (t.amount > 0) { t.account_code = '202'; t.tax_code = 'GST_ON_INCOME'; t.category = 'Other Income'; }
      else               { t.account_code = '499'; t.tax_code = 'GST';           t.category = 'Uncategorised Expense'; }
    }
    return t;
  });
}
