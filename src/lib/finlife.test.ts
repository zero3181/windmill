import fixture from './__fixtures__/finlife-savings.json';
import { normalizeProducts, rankProducts, type FinlifeBase, type FinlifeOption } from './finlife';

jest.mock('expo-sqlite/kv-store', () => ({}));

// 2026년 9월 금융상품한눈에 적금 공시 일부
const products = normalizeProducts(
  fixture.baseList.map((b) => ({
    ...(b as unknown as FinlifeBase),
    group: b.grp === '020000' ? ('bank' as const) : ('savingsBank' as const),
  })),
  fixture.optionList as FinlifeOption[]
);

describe('rankProducts', () => {
  it('open + online-only: one per company, by base rate', () => {
    const ranked = rankProducts(products, { termMonths: 12, openOnly: true, onlineOnly: true });
    expect(ranked.map((p) => `${p.company} ${p.name}`)).toEqual([
      '참저축은행 비대면정기적금',
      '디비저축은행 M-DB행복씨앗적금',
    ]);
    expect(ranked[1].maxRate).toBe(6);
  });

  it('open only: includes products joinable at branches too', () => {
    const ranked = rankProducts(products, { termMonths: 12, openOnly: true });
    const names = ranked.map((p) => `${p.company} ${p.name}`);
    expect(names[0]).toBe('청주저축은행 단비 정기적금');
    expect(names).toContain('금화저축은행 정기적금');
    expect(names).not.toContain('KB저축은행 KB착한누리적금');
  });

  it('excludes companies the user already has', () => {
    const ranked = rankProducts(products, { termMonths: 12, openOnly: true, excludeCompanies: ['청주저축은행'] });
    expect(ranked.map((p) => p.company)).not.toContain('청주저축은행');
  });

  it('no filters: includes restricted products', () => {
    const ranked = rankProducts(products, { termMonths: 12 });
    expect(ranked.map((p) => p.company)).toContain('KB저축은행');
  });
});
