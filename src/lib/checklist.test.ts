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

  it('fills the empty month blades, skipping months already taken', () => {
    // 1월·3월 만기 계좌가 있고 지금은 3월: 이번 달(3월) 자리는 찼으니 4월부터 비어 있는 달을 안내한다.
    const accounts = [savings('jan', '2026-01-10'), savings('mar', '2026-03-10')];
    const c = buildChecklist(goal, 'savings', accounts, '2026-03-20');
    expect(c.doneCount).toBe(2);
    expect(c.steps[2]).toMatchObject({ status: 'scheduled', month: '2026-04-01' });
    const months = c.steps.filter((s) => s.status !== 'done').map((s) => s.month);
    // 2월 자리는 내년 2월에 가입해야 채워진다.
    expect(months).toContain('2027-02-01');
    expect(months).not.toContain('2026-03-01');
    expect(months).toHaveLength(10);
  });

  it('treats the same month in different years as one blade', () => {
    const accounts = [savings('a', '2026-01-10'), savings('b', '2027-01-10')];
    expect(buildChecklist(goal, 'savings', accounts, '2027-01-20').doneCount).toBe(1);
  });

  it('only counts accounts whose term matches the blade count', () => {
    const six = { blades: 6 as const, total: 600_000 };
    const accounts = [
      savings('twelve', '2026-09-10'), // 12개월 적금: 6날개 풍차에는 들어가지 않는다
      savings('six', '2026-08-10', { termMonths: 6, maturityDate: computeMaturityDate('2026-08-10', 6) }),
    ];
    const c = buildChecklist(six, 'savings', accounts, '2026-09-20');
    expect(c.doneCount).toBe(1);
    expect(c.steps[0].account?.id).toBe('six');
    // 9월 자리는 12개월 적금이 채우지 못하니 여전히 지금 가입할 차례다.
    expect(c.steps[1]).toMatchObject({ status: 'now', month: '2026-09-01' });
  });
});
