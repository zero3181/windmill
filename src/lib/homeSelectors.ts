import type { Account } from '../types/account';
import {
  addMonthsClamped,
  calcAccountFinancials,
  parseISODate,
  todayKST,
  withDay,
  type AccountFinancials,
  type ISODate,
} from './calc';

export interface AccountWithFinancials {
  account: Account;
  financials: AccountFinancials;
}

export function monthKey(iso: ISODate): string {
  const { y, m } = parseISODate(iso);
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function withFinancials(accounts: Account[], today: ISODate = todayKST()): AccountWithFinancials[] {
  return accounts.map((account) => ({
    account,
    financials: calcAccountFinancials(account, today),
  }));
}

export interface Summary {
  /** 현재까지 모은 원금 (예금: 예치액, 적금: 납입된 회차 합) */
  totalPrincipal: number;
  /** 만기 시 세후 예상 수령액 (원금 + 세후 이자) */
  totalMaturityPayout: number;
  totalAfterTaxInterest: number;
  totalTaxAmount: number;
  activeCount: number;
}

export function selectSummary(items: AccountWithFinancials[]): Summary {
  const active = items.filter((i) => i.account.status === 'active');
  return {
    totalPrincipal: active.reduce((sum, i) => sum + i.financials.currentPrincipal, 0),
    totalMaturityPayout: active.reduce((sum, i) => sum + i.financials.maturityPayout, 0),
    totalAfterTaxInterest: active.reduce((sum, i) => sum + i.financials.afterTaxInterest, 0),
    totalTaxAmount: active.reduce((sum, i) => sum + i.financials.taxAmount, 0),
    activeCount: active.length,
  };
}

export interface ThisMonth {
  maturing: AccountWithFinancials[];
  savingsDue: { account: Account }[];
  savingsSum: number;
}

export function selectThisMonth(items: AccountWithFinancials[], today: ISODate = todayKST()): ThisMonth {
  const currentMonth = monthKey(today);
  const active = items.filter((i) => i.account.status === 'active');

  const maturing = active
    .filter((i) => monthKey(i.financials.maturityDate) === currentMonth)
    .sort((a, b) => a.financials.daysToMaturity - b.financials.daysToMaturity);

  const savingsDue = active.filter((i) => {
    if (i.account.type !== 'savings') return false;
    const day = i.account.payDay ?? parseISODate(i.account.startDate).d;
    const base = withDay(i.account.startDate, day);
    for (let k = 0; k < i.account.termMonths; k++) {
      const due = addMonthsClamped(base, k);
      if (monthKey(due) === currentMonth) return true;
    }
    return false;
  });

  return {
    maturing,
    savingsDue: savingsDue.map((i) => ({ account: i.account })),
    savingsSum: savingsDue.reduce((sum, i) => sum + i.account.amount, 0),
  };
}

export interface TimelineMonth {
  key: string; // YYYY-MM
  year: number;
  month: number;
  total: number;
  accounts: AccountWithFinancials[];
}

export function selectTimeline(
  items: AccountWithFinancials[],
  today: ISODate = todayKST(),
  monthsAhead = 12
): TimelineMonth[] {
  const active = items.filter((i) => i.account.status === 'active');
  const { y, m } = parseISODate(today);
  const startOfMonth = `${y}-${String(m).padStart(2, '0')}-01`;

  const months: TimelineMonth[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const first = addMonthsClamped(startOfMonth, i);
    const { y: fy, m: fm } = parseISODate(first);
    const key = `${fy}-${String(fm).padStart(2, '0')}`;
    const accountsInMonth = active.filter((a) => monthKey(a.financials.maturityDate) === key);
    months.push({
      key,
      year: fy,
      month: fm,
      total: accountsInMonth.reduce((sum, a) => sum + a.financials.maturityPayout, 0),
      accounts: accountsInMonth,
    });
  }
  return months;
}
