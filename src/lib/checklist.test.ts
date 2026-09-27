import type { Account } from '../types/account';
import { computeMaturityDate } from './calc';
import { buildChecklist } from './checklist';

function savings(id: string, startDate: string, overrides: Partial<Account> = {}): Account {
  return {
    id,
    name: id,
    bank: '',
    type: 'savings',
    amount: 100_000,
    rate: 0,
    taxType: 'general',
    startDate,
    termMonths: 12,
    maturityDate: computeMaturityDate(startDate, 12),
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const goal = { blades: 12 as const, total: 1_200_000 };

describe('buildChecklist', () => {
  it('starts with the first step due this month and the rest locked', () => {
    const c = buildChecklist(goal, 'savings', [], '2026-09-28');
    expect(c.perAccount).toBe(100_000);
    expect(c.termMonths).toBe(12);
    expect(c.steps.map((s) => s.status)).toEqual(['now', ...Array(11).fill('locked')]);
    expect(c.steps[0].month).toBe('2026-09-01');
    expect(c.steps[1].month).toBe('2026-10-01');
    expect(c.steps[11].monthlyOutlay).toBe(1_200_000);
  });

  it('schedules the next step for next month once this month is done', () => {
    const c = buildChecklist(goal, 'savings', [savings('a', '2026-09-28')], '2026-09-28');
    expect(c.steps[0].status).toBe('done');
    expect(c.steps[0].account?.id).toBe('a');
    expect(c.steps[1]).toMatchObject({ status: 'scheduled', month: '2026-10-01' });
    expect(c.steps[2].status).toBe('locked');
  });

  it('makes the next step due when its month arrives, or right away if late', () => {
    const accounts = [savings('a', '2026-09-28')];
    expect(buildChecklist(goal, 'savings', accounts, '2026-10-01').steps[1]).toMatchObject({
      status: 'now',
      month: '2026-10-01',
    });
    // 두 달 늦었으면 이번 달에 바로 가입하도록 안내한다.
    expect(buildChecklist(goal, 'savings', accounts, '2026-12-05').steps[1]).toMatchObject({
      status: 'now',
      month: '2026-12-01',
    });
  });

  it('counts accounts maturing in the same month as one step and ignores other types', () => {
    const accounts = [
      savings('a', '2026-09-01'),
      savings('b', '2026-09-20'),
      savings('d', '2026-09-10', { type: 'deposit' }),
      savings('c', '2026-08-15', { status: 'closed' }),
    ];
    const c = buildChecklist(goal, 'savings', accounts, '2026-09-28');
    expect(c.doneCount).toBe(1);
    expect(c.steps[0].account?.id).toBe('a');
  });

  it('reopens a step when a matured account leaves the windmill', () => {
    const months = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}-10`);
    const full = months.map((d, i) => savings(`s${i}`, d));
    expect(buildChecklist(goal, 'savings', full, '2026-12-20').complete).toBe(true);

    // 첫 계좌가 2027년 1월에 만기돼 해지되면, 그 달에 다시 가입할 차례가 된다.
    const afterMaturity = full.map((a, i) => (i === 0 ? { ...a, status: 'closed' as const } : a));
    const c = buildChecklist(goal, 'savings', afterMaturity, '2027-01-10');
    expect(c.doneCount).toBe(11);
    expect(c.steps[11]).toMatchObject({ status: 'now', month: '2027-01-01' });
  });
});
