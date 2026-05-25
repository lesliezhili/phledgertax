import { autoCategorise, DEFAULT_COA, DEFAULT_RULES } from '@/lib/categoriser';
import type { Transaction } from '@/types/index';

const tx = (desc: string, amount: number): Transaction => ({
  id: 'x', date: '2025-07-01', description: desc, amount, currency: 'AUD', bank: 'anz',
});

describe('autoCategorise', () => {
  it('classifies client invoice as Sales Revenue (200)', () => {
    const result = autoCategorise([tx('Client Invoice 001', 5000)]);
    expect(result[0].account_code).toBe('200');
  });

  it('classifies Uber Eats as Meals & Entertainment (407) — not travel', () => {
    const result = autoCategorise([tx('Uber Eats delivery', -45)]);
    expect(result[0].account_code).toBe('407');
    expect(result[0].category).toBe('Meals & Entertainment');
  });

  it('classifies generic Uber ride as Travel (402)', () => {
    const result = autoCategorise([tx('Uber trip CBD', -25)]);
    expect(result[0].account_code).toBe('402');
  });

  it('UBEREATS no-space matches Meals (407)', () => {
    const result = autoCategorise([tx('UBEREATS order #1234', -30)]);
    expect(result[0].account_code).toBe('407');
  });

  it('classifies Netflix as Software Subscriptions (401)', () => {
    const result = autoCategorise([tx('Netflix subscription', -19.99)]);
    expect(result[0].account_code).toBe('401');
  });

  it('classifies Telstra as Telecommunications (404)', () => {
    const result = autoCategorise([tx('Telstra Mobile Bill', -89)]);
    expect(result[0].account_code).toBe('404');
  });

  it('falls back to Other Income (202) for unmatched positive', () => {
    const result = autoCategorise([tx('Mystery Deposit', 999)]);
    expect(result[0].account_code).toBe('202');
  });

  it('falls back to Uncategorised Expense (499) for unmatched negative', () => {
    const result = autoCategorise([tx('Unknown Expense', -50)]);
    expect(result[0].account_code).toBe('499');
  });

  it('does not mutate the original transaction object', () => {
    const original = tx('Client Invoice', 1000);
    const before = { ...original };
    autoCategorise([original]);
    expect(original.description).toBe(before.description);
    expect(original.amount).toBe(before.amount);
  });
});

describe('DEFAULT_COA', () => {
  it('has exactly 26 accounts', () => expect(DEFAULT_COA).toHaveLength(26));
  it('has 3 INCOME accounts', () => expect(DEFAULT_COA.filter(a => a.type === 'INCOME')).toHaveLength(3));
  it('has 16 EXPENSE accounts', () => expect(DEFAULT_COA.filter(a => a.type === 'EXPENSE')).toHaveLength(16));
});

describe('DEFAULT_RULES order', () => {
  it('Uber Eats rule appears before generic Uber rule', () => {
    const eatsIdx = DEFAULT_RULES.findIndex(r => r.pattern.source.includes('eats'));
    const uberIdx = DEFAULT_RULES.findIndex(r => !r.pattern.source.includes('eats') && r.pattern.source.includes('uber'));
    expect(eatsIdx).toBeLessThan(uberIdx);
  });
});
