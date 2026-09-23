import type { Account } from '../types/account';
import { selectSummary, selectThisMonth, selectTimeline, withFinancials } from './homeSelectors';

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
