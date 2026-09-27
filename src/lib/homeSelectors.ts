import type { Account } from '../types/account';
import {
  addMonthsClamped,
  calcAccountFinancials,
  compareISODates,
  daysInMonth,
  parseISODate,
  toISODate,
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

export interface WindmillBar {
  item: AccountWithFinancials;
  /** 차트 시작월 기준 월 단위 위치 (일자는 소수로 반영) */
  start: number;
  end: number;
  /** 가입일부터 매월 돌아오는 회차 경계 위치 (첫 회차, 만기 제외) */
  ticks: number[];
  /** 이 계좌가 채우는 풍차 날개 순번: 서로 다른 만기월을 이른 순으로 센 번호 (같은 만기월이면 같은 번호) */
  bladeIndex: number;
}

export interface Windmill {
  bars: WindmillBar[];
  /** 차트 첫 달 (YYYY-MM-01) */
  rangeStart: ISODate;
  /** 차트에 그릴 전체 개월 수 */
  monthCount: number;
  today: number;
  count: number;
  /** 만기월(YYYY-MM)이 서로 다른 계좌 수. 같은 달에 만기되는 계좌는 날개 하나로 친다. */
  maturityMonthCount: number;
  /** 지금까지 납입한 원금 합계 (적금: 납입된 회차 합, 예금: 예치액) */
  totalPrincipal: number;
}

/** date가 base 달의 1일로부터 몇 개월 떨어졌는지, 일자는 해당 월 일수 대비 소수로. */
function monthPosition(base: ISODate, date: ISODate): number {
  const b = parseISODate(base);
  const { y, m, d } = parseISODate(date);
  return (y - b.y) * 12 + (m - b.m) + (d - 1) / daysInMonth(y, m);
}

export function selectWindmill(
  items: AccountWithFinancials[],
  type: Account['type'],
  today: ISODate = todayKST()
): Windmill {
  const rows = items
    .filter((i) => i.account.status === 'active' && i.account.type === type)
    .sort(
      (a, b) =>
        compareISODates(a.account.startDate, b.account.startDate) ||
        compareISODates(a.financials.maturityDate, b.financials.maturityDate)
    );

  const firstDates = [today, ...rows.map((r) => r.account.startDate)].sort(compareISODates);
  const lastDates = [today, ...rows.map((r) => r.financials.maturityDate)].sort(compareISODates);
  const { y, m } = parseISODate(firstDates[0]);
  const rangeStart = toISODate(y, m, 1);
  const monthCount = Math.floor(monthPosition(rangeStart, lastDates[lastDates.length - 1])) + 1;

  const maturityMonths = [...new Set(rows.map((r) => monthKey(r.financials.maturityDate)))].sort();

  const bars = rows.map((item) => {
    const { startDate, termMonths } = item.account;
    const ticks: number[] = [];
    for (let k = 1; k < termMonths; k++) {
      ticks.push(monthPosition(rangeStart, addMonthsClamped(startDate, k)));
    }
    return {
      item,
      start: monthPosition(rangeStart, startDate),
      end: monthPosition(rangeStart, item.financials.maturityDate),
      ticks,
      bladeIndex: maturityMonths.indexOf(monthKey(item.financials.maturityDate)),
    };
  });

  return {
    bars,
    rangeStart,
    monthCount,
    today: monthPosition(rangeStart, today),
    count: rows.length,
    maturityMonthCount: maturityMonths.length,
    totalPrincipal: rows.reduce((sum, r) => sum + r.financials.currentPrincipal, 0),
  };
}

export interface Upcoming {
  items: AccountWithFinancials[];
  /** 기간 안에 만기가 없어 가장 가까운 만기 하나만 보여주는 경우 */
  nextOnly: boolean;
}

/**
 * 풍차에서 챙겨야 할 만기: 해당 종류의 진행 중 계좌 중 withinDays일 안에 만기되는 계좌
 * (만기가 지났는데 아직 처리하지 않은 계좌 포함). 없으면 가장 가까운 만기 하나.
 */
export function selectUpcoming(items: AccountWithFinancials[], type: Account['type'], withinDays = 30): Upcoming {
  const active = items
    .filter((i) => i.account.status === 'active' && i.account.type === type)
    .sort((a, b) => a.financials.daysToMaturity - b.financials.daysToMaturity);
  const soon = active.filter((i) => i.financials.daysToMaturity <= withinDays);
  if (soon.length > 0) return { items: soon, nextOnly: false };
  return { items: active.slice(0, 1), nextOnly: active.length > 0 };
}
