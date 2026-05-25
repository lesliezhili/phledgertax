// lib/store.js
import path from 'path';
import fs from 'fs';
import { parseCsv } from './csvIngestion.js';
import { autoCategorise } from './categoriser.js';

export const AU_BANKS = ['anz','nab','cba','westpac'];
export const CA_BANKS = ['rbc','td','bmo','scotiabank','cibc'];
export const COUNTRY_BANKS = { AU: AU_BANKS, CA: CA_BANKS };

export function countryOf(bank) {
  if (AU_BANKS.includes(bank)) return 'AU';
  if (CA_BANKS.includes(bank)) return 'CA';
  return 'AU';
}

function getBankDir() {
  return process.env.BANK_DATA_PATH || path.join(process.cwd(), 'bank_data');
}

export function loadBank(bank) {
  const bankDir = path.join(getBankDir(), bank);
  if (!fs.existsSync(bankDir)) return [];
  const seen = new Map();
  for (const f of getAllCsvFiles(bankDir)) {
    try {
      const txs = parseCsv(fs.readFileSync(f, 'utf-8'), bank);
      for (const tx of txs) seen.set(tx.id, tx);
    } catch {}
  }
  return [...seen.values()].sort((a,b) => a.date.localeCompare(b.date));
}

export function loadCountry(country) {
  const banks = COUNTRY_BANKS[country.toUpperCase()] || [];
  const seen = new Map();
  for (const bank of banks) {
    for (const tx of loadBank(bank)) seen.set(tx.id, tx);
  }
  return [...seen.values()].sort((a,b) => a.date.localeCompare(b.date));
}

export function loadAll() {
  const bankDir = getBankDir();
  if (!fs.existsSync(bankDir)) return [];
  const seen = new Map();
  for (const bank of [...AU_BANKS, ...CA_BANKS]) {
    for (const tx of loadBank(bank)) seen.set(tx.id, tx);
  }
  return [...seen.values()].sort((a,b) => a.date.localeCompare(b.date));
}

function getAllCsvFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results.push(...getAllCsvFiles(full));
    else if (entry.endsWith('.csv')) results.push(full);
  }
  return results;
}
