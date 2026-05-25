// lib/chatAgent.js
import { loadAll, loadCountry, AU_BANKS, CA_BANKS } from './store.js';
import { generateBasDraft, generateQuarterlyBas } from './basAu.js';
import { draftAuCompanyTax, draftAuPersonalTax } from './taxAu.js';
import { draftCaCorporateTax, draftCaPersonalTax, generateQuarterlyGst, generateAnnualHst } from './taxCa.js';
import { generateFinancialStatements } from './financialStatements.js';

function today() { return new Date().toISOString().slice(0,10); }
function currentYear() { return new Date().getFullYear(); }

export function handleChat(message) {
  const msg = message.toLowerCase().trim();

  if (['help','?','commands'].includes(msg))
    return { message: `PHLedger Commands:\n  help | status\nAU: au transactions | au p&l | au financials | bas | quarterly bas | au company tax | au personal tax\nCA: ca transactions | ca p&l | ca financials | gst | annual hst | ca corporate tax | ca personal tax` };

  if (msg === 'status') {
    const au = loadCountry('AU'), ca = loadCountry('CA');
    return { message: `AU: ${au.length} transactions | CA: ${ca.length} transactions | Total: ${au.length + ca.length}` };
  }

  if (msg.includes('au transactions')) {
    const txs = loadCountry('AU');
    return { message: `AU transactions: ${txs.length}`, data: { transactions: txs.slice(0,20) } };
  }
  if (msg.includes('ca transactions')) {
    const txs = loadCountry('CA');
    return { message: `CA transactions: ${txs.length}`, data: { transactions: txs.slice(0,20) } };
  }
  if (msg.includes('au p&l') || msg.includes('au profit')) {
    const txs = loadCountry('AU');
    const fs = generateFinancialStatements(today(), txs);
    return { message: 'AU P&L', data: { profit_loss: fs.profit_loss, banks: AU_BANKS } };
  }
  if (msg.includes('ca p&l') || msg.includes('ca profit')) {
    const txs = loadCountry('CA');
    const fs = generateFinancialStatements(today(), txs);
    return { message: 'CA P&L', data: { profit_loss: fs.profit_loss, banks: CA_BANKS } };
  }
  if (msg.includes('au financials')) {
    return { message: 'AU Financials', data: generateFinancialStatements(today(), loadCountry('AU')) };
  }
  if (msg.includes('ca financials')) {
    return { message: 'CA Financials', data: generateFinancialStatements(today(), loadCountry('CA')) };
  }
  if (msg.includes('quarterly bas')) {
    const yr = new Date().getMonth() >= 6 ? currentYear() : currentYear() - 1;
    return { message: `AU BAS FY${yr}`, data: { quarters: generateQuarterlyBas(loadCountry('AU'), yr) } };
  }
  if (msg.includes('bas')) {
    const txs = loadCountry('AU');
    const dates = txs.map(t => t.date).sort();
    const start = dates[0] || `${currentYear()}-07-01`;
    return { message: 'AU BAS Draft', data: generateBasDraft(txs, start, today()) };
  }
  if (msg.includes('annual hst')) {
    return { message: `CA Annual HST ${currentYear()}`, data: generateAnnualHst(currentYear(), loadCountry('CA')) };
  }
  if (msg.includes('gst')) {
    const q = Math.floor(new Date().getMonth() / 3) + 1;
    return { message: `CA GST Q${q}`, data: generateQuarterlyGst(currentYear(), q, loadCountry('CA')) };
  }
  if (msg.includes('au company tax')) return { message: 'AU Company Tax', data: draftAuCompanyTax(currentYear(), loadCountry('AU')) };
  if (msg.includes('au personal tax')) return { message: 'AU Personal Tax', data: draftAuPersonalTax(currentYear(), loadCountry('AU')) };
  if (msg.includes('ca corporate tax')) return { message: 'CA Corporate Tax', data: draftCaCorporateTax(currentYear(), loadCountry('CA')) };
  if (msg.includes('ca personal tax')) return { message: 'CA Personal Tax', data: draftCaPersonalTax(currentYear(), loadCountry('CA')) };

  return { message: `Unknown command: '${message}'. Type 'help' for available commands.` };
}
