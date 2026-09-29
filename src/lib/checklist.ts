import type { Account, AccountType } from '../types/account';
import { bladePosition, fitsWindmill } from './blades';
import { addMonthsClamped, compareISODates, parseISODate, toISODate, type ISODate } from './calc';
import type { WindmillGoal } from './settings';

/**
 * - done: 이 날개를 채운 계좌가 있다
 * - now: 지금 가입할 차례
 * - scheduled: 다음 차례지만 이번 달 자리는 이미 채워져 있어, 비어 있는 다음 달을 기다린다
 * - locked: 앞 단계를 먼저 해야 한다
 */
export type StepStatus = 'done' | 'now' | 'scheduled' | 'locked';

export interface ChecklistStep {
  /** 0부터 */
  index: number;
  status: StepStatus;
  /** 가입(했거나 할) 달의 1일. 가입할 달은 날개 자리가 비어 있는 달이다. */
  month: ISODate;
  /** done일 때 이 날개를 채운 계좌 */
  account?: Account;
  /** 적금: 이 계좌까지 가입했을 때 매달 넣는 총액 */
  monthlyOutlay: number;
}

export interface Checklist {
  steps: ChecklistStep[];
  /** 적금: 계좌당 월 납입액, 예금: 계좌당 예치금 */
  perAccount: number;
  /** 계좌 하나의 가입 기간 = 날개 수 (매달 하나씩 만기가 돌아오도록) */
  termMonths: number;
  doneCount: number;
  complete: boolean;
}

function firstOfMonth(date: ISODate): ISODate {
  const { y, m } = parseISODate(date);
  return toISODate(y, m, 1);
}

/**
 * 풍차 목표와 가입한 계좌로 할 일 목록을 만든다.
 * 날개 하나가 만기월 하나를 뜻하므로(bladePosition), 비어 있는 날개 자리를 채우는 순서로 안내한다.
 * 계좌 기간이 날개 수와 같으니, 이번 달에 가입하면 이번 달 자리가 채워진다.
 * 그래서 다음 할 일은 '자리가 비어 있는 가장 가까운 달'에 가입하는 것이다.
 * 만기가 끝나 계좌가 빠지면 그 자리가 다시 비어 '가입할 차례'가 된다.
 */
export function buildChecklist(goal: WindmillGoal, type: AccountType, accounts: Account[], today: ISODate): Checklist {
  const { blades, total } = goal;
  const perAccount = Math.floor(total / blades);

  // 날개 자리마다 가장 먼저 가입한 계좌 하나를 그 날개의 주인으로 본다. 기간이 풍차와 다른 계좌는 빼고 센다.
  const byBlade = new Map<number, Account>();
  for (const account of accounts
    .filter((a) => a.status === 'active' && a.type === type && fitsWindmill(a, blades))
    .sort((a, b) => compareISODates(a.startDate, b.startDate))) {
    const blade = bladePosition(account.maturityDate, blades);
    if (!byBlade.has(blade)) byBlade.set(blade, account);
  }
  const done = [...byBlade.values()].sort((a, b) => compareISODates(a.maturityDate, b.maturityDate));

  // 이번 달부터 한 달씩 보며, 자리가 비어 있는 달을 가입할 달로 고른다.
  const thisMonth = firstOfMonth(today);
  const upcoming: ISODate[] = [];
  const taken = new Set(byBlade.keys());
  for (let k = 0; upcoming.length < blades - done.length && k < blades; k++) {
    const month = addMonthsClamped(thisMonth, k);
    const blade = bladePosition(month, blades);
    if (taken.has(blade)) continue;
    taken.add(blade);
    upcoming.push(month);
  }

  const steps: ChecklistStep[] = [
    ...done.map((account, i) => ({
      index: i,
      status: 'done' as const,
      month: firstOfMonth(account.startDate),
      account,
      monthlyOutlay: perAccount * (i + 1),
    })),
    ...upcoming.map((month, k) => {
      const index = done.length + k;
      const status: StepStatus = k > 0 ? 'locked' : month === thisMonth ? 'now' : 'scheduled';
      return { index, status, month, monthlyOutlay: perAccount * (index + 1) };
    }),
  ];

  return { steps, perAccount, termMonths: blades, doneCount: done.length, complete: done.length >= blades };
}
