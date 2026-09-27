import { divisors, planWindmill } from './windmillPlan';

describe('divisors', () => {
  it('lists divisors in ascending order', () => {
    expect(divisors(12)).toEqual([1, 2, 3, 4, 6, 12]);
    expect(divisors(6)).toEqual([1, 2, 3, 6]);
  });
});

describe('planWindmill', () => {
  it('monthly maturity: 12 savings of 100,000 make 1,200,000 a month', () => {
    const plan = planWindmill(
      { type: 'savings', termMonths: 12, intervalMonths: 1, perAccount: 100_000, rate: 0, taxType: 'general' },
      '2026-01-10'
    );
    expect(plan.count).toBe(12);
    expect(plan.total).toBe(1_200_000);
    expect(plan.openings[1]).toBe('2026-02-10');
    expect(plan.maturities[0]).toBe('2027-01-10');
    expect(plan.maturities[11]).toBe('2027-12-10');
    expect(plan.fullFromMonth).toBe(12);
    expect(plan.payoutPerAccount).toBe(1_200_000);
  });

  it('quarterly maturity: 4 savings of 300,000 make 1,200,000 a month', () => {
    const plan = planWindmill(
      { type: 'savings', termMonths: 12, intervalMonths: 3, perAccount: 300_000, rate: 0, taxType: 'general' },
      '2026-01-10'
    );
    expect(plan.count).toBe(4);
    expect(plan.total).toBe(1_200_000);
    expect(plan.openings).toEqual(['2026-01-10', '2026-04-10', '2026-07-10', '2026-10-10']);
    expect(plan.fullFromMonth).toBe(10);
  });

  it('computes after-tax payout with the same formula as accounts', () => {
    const plan = planWindmill(
      { type: 'deposit', termMonths: 12, intervalMonths: 3, perAccount: 10_000_000, rate: 3.5, taxType: 'general' },
      '2026-01-10'
    );
    // 이자 350,000 - 세금 53,900
    expect(plan.afterTaxInterestPerAccount).toBe(296_100);
    expect(plan.totalPayout).toBe((10_000_000 + 296_100) * 4);
  });
});
