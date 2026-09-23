import {
  addDays,
  addMonthsClamped,
  calcAccountFinancials,
  computeMaturityDate,
  countElapsedInstallments,
  daysInMonth,
  diffInDays,
  withDay,
} from './calc';

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-09-23', 5)).toBe('2026-09-28');
  });
  it('rolls over a month boundary', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03');
  });
  it('handles negative days across a month boundary', () => {
    expect(addDays('2026-10-01', -7)).toBe('2026-09-24');
  });
  it('handles leap year Feb 29 boundary', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });
});

describe('daysInMonth', () => {
  it('returns 28 for Feb in a common year', () => {
    expect(daysInMonth(2025, 2)).toBe(28);
  });
  it('returns 29 for Feb in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
  it('returns 31 for Jan', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
  });
});

describe('addMonthsClamped', () => {
  it('adds months normally', () => {
    expect(addMonthsClamped('2026-01-15', 2)).toBe('2026-03-15');
  });
  it('rolls over year boundary', () => {
    expect(addMonthsClamped('2026-11-01', 3)).toBe('2027-02-01');
  });
  it('clamps to month-end when day does not exist (31 -> 30)', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
  });
  it('clamps Jan 31 + 1 month in a leap year to Feb 29', () => {
    expect(addMonthsClamped('2024-01-31', 1)).toBe('2024-02-29');
  });
  it('handles 12-month term (typical savings/deposit term)', () => {
    expect(addMonthsClamped('2026-03-31', 12)).toBe('2027-03-31');
  });
});

describe('withDay', () => {
  it('clamps day to last day of month', () => {
    expect(withDay('2026-02-10', 31)).toBe('2026-02-28');
  });
  it('keeps day when valid', () => {
    expect(withDay('2026-05-10', 15)).toBe('2026-05-15');
  });
});

describe('computeMaturityDate', () => {
  it('start + termMonths', () => {
    expect(computeMaturityDate('2026-09-23', 12)).toBe('2027-09-23');
  });
});

describe('diffInDays', () => {
  it('computes positive difference', () => {
    expect(diffInDays('2026-10-01', '2026-09-23')).toBe(8);
  });
  it('computes negative difference for past dates', () => {
    expect(diffInDays('2026-09-01', '2026-09-23')).toBe(-22);
  });
  it('is zero for the same date', () => {
    expect(diffInDays('2026-09-23', '2026-09-23')).toBe(0);
  });
});

describe('countElapsedInstallments', () => {
  it('counts the first installment on the start date itself', () => {
    expect(countElapsedInstallments('2026-01-15', 15, 12, '2026-01-15')).toBe(1);
  });
  it('counts zero before the first due date', () => {
    expect(countElapsedInstallments('2026-01-15', 15, 12, '2026-01-14')).toBe(0);
  });
  it('counts monthly installments up to today', () => {
    // due dates: 1/15, 2/15, 3/15, 4/15 ... ; today = 4/10 -> 3 installments elapsed
    expect(countElapsedInstallments('2026-01-15', 15, 12, '2026-04-10')).toBe(3);
  });
  it('caps at termMonths even if today is long past maturity', () => {
    expect(countElapsedInstallments('2026-01-15', 15, 12, '2030-01-01')).toBe(12);
  });
  it('handles month-end payDay clamping (Jan 31 -> Feb 28)', () => {
    // due dates: 1/31, 2/28, 3/31 ...; today = 3/1 -> 2 installments elapsed
    expect(countElapsedInstallments('2026-01-31', 31, 12, '2026-03-01')).toBe(2);
  });
});

describe('calcAccountFinancials - deposit', () => {
  it('calculates gross/after-tax interest and payout for a 12-month general-tax deposit', () => {
    // P=10,000,000, r=3.50%, n=12, general tax 15.4%
    // I = 10,000,000 * 0.035 * 12/12 = 350,000
    // tax = floor(350000 * 0.154) = 53,900
    // afterTax = 296,100
    const result = calcAccountFinancials(
      {
        type: 'deposit',
        amount: 10_000_000,
        rate: 3.5,
        taxType: 'general',
        startDate: '2026-01-15',
        termMonths: 12,
        maturityDate: '',
      },
      '2026-01-15'
    );
    expect(result.grossInterest).toBe(350_000);
    expect(result.taxAmount).toBe(53_900);
    expect(result.afterTaxInterest).toBe(296_100);
    expect(result.currentPrincipal).toBe(10_000_000);
    expect(result.maturityPayout).toBe(10_296_100);
    expect(result.maturityDate).toBe('2027-01-15');
  });

  it('applies exempt tax type with zero tax', () => {
    const result = calcAccountFinancials(
      {
        type: 'deposit',
        amount: 1_000_000,
        rate: 4,
        taxType: 'exempt',
        startDate: '2026-01-01',
        termMonths: 6,
        maturityDate: '',
      },
      '2026-01-01'
    );
    // I = 1,000,000 * 0.04 * 6/12 = 20,000
    expect(result.grossInterest).toBe(20_000);
    expect(result.taxAmount).toBe(0);
    expect(result.afterTaxInterest).toBe(20_000);
    expect(result.maturityPayout).toBe(1_020_000);
  });
});

describe('calcAccountFinancials - savings', () => {
  it('calculates interest using the sum-of-months formula', () => {
    // M=500,000, r=4.00%, n=12
    // I = 500,000 * (0.04/12) * 12*13/2 = 500,000 * 0.0033333.. * 78 = 130,000
    const result = calcAccountFinancials(
      {
        type: 'savings',
        amount: 500_000,
        rate: 4,
        taxType: 'preferential',
        startDate: '2026-01-15',
        termMonths: 12,
        payDay: 15,
        maturityDate: '',
      },
      '2026-01-15'
    );
    expect(result.grossInterest).toBe(130_000);
    // tax = floor(130000 * 0.095) = 12,350
    expect(result.taxAmount).toBe(12_350);
    expect(result.afterTaxInterest).toBe(117_650);
    expect(result.currentPrincipal).toBe(500_000); // only the first installment has occurred
    expect(result.maturityPayout).toBe(500_000 * 12 + 117_650);
  });

  it('accumulates current principal as installments occur', () => {
    const result = calcAccountFinancials(
      {
        type: 'savings',
        amount: 200_000,
        rate: 3,
        taxType: 'general',
        startDate: '2026-01-15',
        termMonths: 12,
        payDay: 15,
        maturityDate: '',
      },
      '2026-04-16'
    );
    expect(result.currentPrincipal).toBe(200_000 * 4);
  });
});
