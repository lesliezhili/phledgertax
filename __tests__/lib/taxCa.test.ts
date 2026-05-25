import { draftCaCorporateTax, generateQuarterlyGst, generateAnnualHst } from '@/lib/taxCa';
import type { Transaction } from '@/types/index';

const caTx = (amount: number, date = '2025-01-15'): Transaction => ({
  id: 'x', date, description: 'Item', amount, currency: 'CAD', bank: 'rbc',
});

describe('draftCaCorporateTax', () => {
  it('9% federal + 8% provincial on net income', () => {
    const r = draftCaCorporateTax(2025, [caTx(100_000), caTx(-20_000)]);
    expect(r.federal_tax).toBeCloseTo(7200, 1);
    expect(r.provincial_tax).toBeCloseTo(6400, 1);
    expect(r.total_tax).toBeCloseTo(13_600, 1);
  });

  it('total = federal + provincial', () => {
    const r = draftCaCorporateTax(2025, [caTx(50_000)]);
    expect(r.total_tax).toBeCloseTo(r.federal_tax + r.provincial_tax, 2);
  });
});

describe('generateQuarterlyGst', () => {
  it('uses divisor 21 for GST-inclusive extraction', () => {
    const r = generateQuarterlyGst(2025, 1, [caTx(21_000)]);
    expect(r.gst_collected).toBeCloseTo(5000, 1);
  });

  it('net GST = collected - paid', () => {
    const r = generateQuarterlyGst(2025, 1, [caTx(21_000), caTx(-10_500)]);
    expect(r.net_gst).toBeCloseTo(r.gst_collected - r.gst_paid, 2);
  });
});

describe('generateAnnualHst', () => {
  it('returns 4 quarters', () => {
    expect(generateAnnualHst(2025, []).quarters).toHaveLength(4);
  });

  it('annual_gst_collected = sum of quarterly', () => {
    const r = generateAnnualHst(2025, [caTx(21_000)]);
    const sum = r.quarters.reduce((s, q) => s + q.gst_collected, 0);
    expect(r.annual_gst_collected).toBeCloseTo(sum, 2);
  });
});
