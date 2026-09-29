import type { Account } from '../types/account';
import { selectSummary, selectThisMonth, selectTimeline, selectUpcoming, selectWindmill, withFinancials } from './homeSelectors';

function makeAccount(overrides: Partial<Account>): Account {
  return {
    id: overrides.id ?? 'a1',
    name: overrides.name ?? '테스트 계좌',
    bank: overrides.bank ?? '테스트은행',
    type: overrides.type ?? 'deposit',
    amount: overrides.amount ?? 1_000_000,
    rate: overrides.rate ?? 3.5,
    taxType: overrides.taxType ?? 'general',
    startDate: overrides.startDate ?? '2026-01-15',
    termMonths: overrides.termMonths ?? 12,
    maturityDate: overrides.maturityDate ?? '2027-01-15',
    payDay: overrides.payDay,
    status: overrides.status ?? 'active',
    memo: overrides.memo,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  };
}

describe('selectSummary', () => {
  it('sums only active accounts', () => {
    const accounts = [
      makeAccount({ id: 'a1', amount: 1_000_000, status: 'active' }),
      makeAccount({ id: 'a2', amount: 2_000_000, status: 'closed' }),
    ];
    const items = withFinancials(accounts, '2026-01-15');
    const summary = selectSummary(items);
    expect(summary.activeCount).toBe(1);
    expect(summary.totalPrincipal).toBe(1_000_000);
  });
});

describe('selectThisMonth', () => {
  it('finds accounts maturing in the current month', () => {
    const accounts = [
      makeAccount({ id: 'a1', maturityDate: '2026-09-30' }),
      makeAccount({ id: 'a2', maturityDate: '2026-10-05' }),
    ];
    const items = withFinancials(accounts, '2026-09-23');
    const thisMonth = selectThisMonth(items, '2026-09-23');
    expect(thisMonth.maturing.map((i) => i.account.id)).toEqual(['a1']);
  });

  it('finds savings accounts with a payment due this month', () => {
    const accounts = [
      makeAccount({
        id: 's1',
        type: 'savings',
        amount: 300_000,
        startDate: '2026-06-10',
        payDay: 10,
        termMonths: 12,
        maturityDate: '2027-06-10',
      }),
    ];
    const items = withFinancials(accounts, '2026-09-23');
    const thisMonth = selectThisMonth(items, '2026-09-23');
    expect(thisMonth.savingsDue).toHaveLength(1);
    expect(thisMonth.savingsSum).toBe(300_000);
  });
});

describe('selectTimeline', () => {
  it('produces 12 months starting from the current month', () => {
    const accounts = [makeAccount({ id: 'a1', maturityDate: '2026-11-15' })];
    const items = withFinancials(accounts, '2026-09-23');
    const timeline = selectTimeline(items, '2026-09-23', 12);
    expect(timeline).toHaveLength(12);
    expect(timeline[0].key).toBe('2026-09');
    expect(timeline[11].key).toBe('2027-08');
    const novemberBucket = timeline.find((t) => t.key === '2026-11');
    expect(novemberBucket?.accounts).toHaveLength(1);
    expect(novemberBucket?.total).toBeGreaterThan(0);
  });

  it('leaves months with no maturities at zero (빈 달 강조 대상)', () => {
    const accounts = [makeAccount({ id: 'a1', maturityDate: '2026-11-15' })];
    const items = withFinancials(accounts, '2026-09-23');
    const timeline = selectTimeline(items, '2026-09-23', 12);
    const septemberBucket = timeline.find((t) => t.key === '2026-09');
    expect(septemberBucket?.total).toBe(0);
    expect(septemberBucket?.accounts).toHaveLength(0);
  });
});

describe('selectWindmill', () => {
  it('builds one bar per active account of the tab, sorted by start date', () => {
    const accounts = [
      makeAccount({ id: 's2', type: 'savings', amount: 100_000, startDate: '2026-02-01', maturityDate: '2027-02-01' }),
      makeAccount({ id: 's1', type: 'savings', amount: 200_000, startDate: '2026-01-01', maturityDate: '2027-01-01' }),
      makeAccount({ id: 'd1', type: 'deposit', startDate: '2026-01-01', maturityDate: '2027-01-01' }),
      makeAccount({ id: 's3', type: 'savings', status: 'closed' }),
    ];
    const w = selectWindmill(withFinancials(accounts, '2026-03-01'), 'savings', '2026-03-01');

    expect(w.bars.map((b) => b.item.account.id)).toEqual(['s1', 's2']);
    expect(w.count).toBe(2);
    expect(w.filledBlades).toEqual([1, 2]); // 1월·2월 만기
    // 2026-03-01 기준 s1은 3회(1·2·3월), s2는 2회(2·3월) 납입
    expect(w.totalPrincipal).toBe(200_000 * 3 + 100_000 * 2);
    expect(w.rangeStart).toBe('2026-01-01');
    expect(w.monthCount).toBe(14); // 2026-01 ~ 2027-02
    expect(w.bars[0].start).toBe(0);
    expect(w.bars[0].end).toBe(12);
    expect(w.bars[1].start).toBe(1);
    expect(w.bars[0].ticks).toHaveLength(11);
    expect(w.today).toBe(2);
  });

  it('puts each account on the blade of its maturity month', () => {
    const accounts = [
      makeAccount({ id: 'a', type: 'savings', startDate: '2026-01-05', maturityDate: '2027-01-05' }),
      makeAccount({ id: 'b', type: 'savings', startDate: '2026-01-20', maturityDate: '2027-01-20' }),
      makeAccount({ id: 'c', type: 'savings', startDate: '2026-02-05', maturityDate: '2027-02-05' }),
    ];
    const w = selectWindmill(withFinancials(accounts, '2026-03-01'), 'savings', '2026-03-01');
    expect(w.count).toBe(3);
    // 같은 1월 만기 두 계좌는 1월 날개 하나를 채운다.
    expect(w.filledBlades).toEqual([1, 2]);
    expect(w.bars.map((b) => b.bladeIndex)).toEqual([1, 1, 2]);
  });

  it('skips blades for months that are not filled yet', () => {
    const accounts = [
      makeAccount({ id: 'jan', type: 'savings', startDate: '2026-01-10', maturityDate: '2027-01-10' }),
      makeAccount({ id: 'mar', type: 'savings', startDate: '2026-03-10', maturityDate: '2027-03-10' }),
      makeAccount({ id: 'dec', type: 'savings', startDate: '2025-12-10', maturityDate: '2026-12-10' }),
    ];
    const w = selectWindmill(withFinancials(accounts, '2026-03-20'), 'savings', '2026-03-20');
    // 12월은 12시 방향(0), 1월은 1, 3월은 3. 2월 날개는 비어 있다.
    expect(w.filledBlades).toEqual([0, 1, 3]);
    // 12개월 계좌는 6날개 풍차의 주기와 맞지 않아 날개를 채우지 않는다.
    const six = selectWindmill(withFinancials(accounts, '2026-03-20'), 'savings', '2026-03-20', 6);
    expect(six.filledBlades).toEqual([]);
    expect(six.bars.every((b) => b.bladeIndex === -1)).toBe(true);
  });

  it('places mid-month dates fractionally', () => {
    const accounts = [
      makeAccount({ id: 'a', type: 'deposit', startDate: '2026-04-16', termMonths: 6, maturityDate: '2026-10-16' }),
    ];
    const w = selectWindmill(withFinancials(accounts, '2026-05-01'), 'deposit', '2026-05-01');
    expect(w.bars[0].start).toBeCloseTo(15 / 30);
    expect(w.bars[0].end).toBeCloseTo(6 + 15 / 31);
  });

  it('still covers today when there are no accounts', () => {
    const w = selectWindmill([], 'deposit', '2026-09-27');
    expect(w.bars).toEqual([]);
    expect(w.monthCount).toBe(1);
  });
});

describe('selectUpcoming', () => {
  const today = '2026-09-27';
  const accounts = [
    makeAccount({ id: 'd1', type: 'deposit', startDate: '2025-12-05', maturityDate: '2026-12-05' }),
    makeAccount({ id: 'd2', type: 'deposit', startDate: '2025-10-10', maturityDate: '2026-10-10' }),
    makeAccount({ id: 'd0', type: 'deposit', startDate: '2025-09-20', maturityDate: '2026-09-20' }),
    makeAccount({ id: 's1', type: 'savings', startDate: '2025-10-01', maturityDate: '2026-10-01' }),
  ];

  it('lists maturities within 30 days of the chosen type, overdue first', () => {
    const r = selectUpcoming(withFinancials(accounts, today), 'deposit');
    expect(r.items.map((i) => i.account.id)).toEqual(['d0', 'd2']);
    expect(r.nextOnly).toBe(false);
  });

  it('falls back to the single nearest maturity', () => {
    const later = [makeAccount({ id: 'd1', type: 'deposit', startDate: '2025-12-05', maturityDate: '2026-12-05' })];
    const r = selectUpcoming(withFinancials(later, today), 'deposit');
    expect(r.items.map((i) => i.account.id)).toEqual(['d1']);
    expect(r.nextOnly).toBe(true);
  });

  it('is empty when there is no account of that type', () => {
    const depositsOnly = accounts.filter((a) => a.type === 'deposit');
    expect(selectUpcoming(withFinancials(depositsOnly, today), 'savings')).toEqual({ items: [], nextOnly: false });
  });
});
