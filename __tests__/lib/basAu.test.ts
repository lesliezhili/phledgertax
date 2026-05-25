import { generateBasDraft, generateQuarterlyBas } from '@/lib/basAu';
import type { Transaction } from '@/types/index';

const auTx = (amount: number, date = '2025-08-01'): Transaction => ({
  id: 'x', date, description: 'Item', amount, currency: 'AUD', bank: 'anz',
});

describe('generateBasDraft', () => {
  it('g1_total_sales = sum of positives in period', () => {
    const bas = generateBasDraft([auTx(1100), auTx(-550)], '2025-07-01', '2025-09-30');
    expect(bas.g1_total_sales).toBe(1100);
  });

  it('net_gst_payable = 1A - 1B', () => {
    const bas = generateBasDraft([auTx(1100), auTx(-550)], '2025-07-01', '2025-09-30');
    expect(bas.net_gst_payable).toBeCloseTo(bas.gst_on_sales_1a - bas.gst_on_purchases_1b, 2);
  });

  it('excludes transactions outside period', () => {
    const bas = generateBasDraft([auTx(5000, '2024-01-01')], '2025-07-01', '2025-09-30');
    expect(bas.g1_total_sales).toBe(0);
  });

  it('g10_capital_purchases is always 0 (not yet implemented)', () => {
    const bas = generateBasDraft([auTx(1000)], '2025-07-01', '2025-09-30');
    expect(bas.g10_capital_purchases).toBe(0);
  });
});

describe('generateQuarterlyBas', () => {
  it('returns exactly 4 quarters', () => {
    expect(generateQuarterlyBas([], 2025)).toHaveLength(4);
  });

  it('quarter 1 covers Jul-Sep of the FY year', () => {
    const q = generateQuarterlyBas([], 2025)[0];
    expect(q.period_start).toBe('2025-07-01');
    expect(q.period_end).toBe('2025-09-30');
    expect(q.label).toBe('Jul-Sep');
  });

  it('quarter 4 covers Apr-Jun of the FOLLOWING year', () => {
    const q = generateQuarterlyBas([], 2025)[3];
    expect(q.period_start).toBe('2026-04-01');
    expect(q.period_end).toBe('2026-06-30');
  });

  it('fy label is correct', () => {
    const q = generateQuarterlyBas([], 2025)[0];
    expect(q.fy).toBe('FY2025-26');
  });
});
