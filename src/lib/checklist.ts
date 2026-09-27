import type { Account, AccountType } from '../types/account';
import { addMonthsClamped, compareISODates, parseISODate, toISODate, type ISODate } from './calc';
import { monthKey } from './homeSelectors';
import type { WindmillGoal } from './settings';

/**
 * - done: 이 날개를 채운 계좌가 있다
 * - now: 지금 가입할 차례
 * - scheduled: 다음 차례지만 아직 가입할 달이 오지 않았다 (지금 가입하면 앞 계좌와 만기월이 겹친다)
 * - locked: 앞 단계를 먼저 해야 한다
 */
export type StepStatus = 'done' | 'now' | 'scheduled' | 'locked';

export interface ChecklistStep {
  /** 0부터 */
  index: number;
  status: StepStatus;
  /** 가입(했거나 할) 달의 1일. locked는 앞 단계가 제때 끝났을 때의 예상 달이다. */
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
 * 날개와 같은 기준으로, 만기월이 서로 다른 계좌 하나가 한 단계를 채운다.
 * 만기가 끝나 계좌가 빠지면 그 자리가 다시 '가입할 차례'가 된다.
 */
export function buildChecklist(goal: WindmillGoal, type: AccountType, accounts: Account[], today: ISODate): Checklist {
  const { blades, total } = goal;
  const perAccount = Math.floor(total / blades);

  // 만기월마다 가장 먼저 가입한 계좌 하나를 그 날개의 주인으로 본다.
  const byMaturityMonth = new Map<string, Account>();
  for (const account of accounts
    .filter((a) => a.status === 'active' && a.type === type)
    .sort((a, b) => compareISODates(a.startDate, b.startDate))) {
    const key = monthKey(account.maturityDate);
    if (!byMaturityMonth.has(key)) byMaturityMonth.set(key, account);
  }
  const done = [...byMaturityMonth.values()]
    .sort((a, b) => compareISODates(a.maturityDate, b.maturityDate))
    .slice(0, blades);

  // 다음 가입 달: 마지막으로 가입한 계좌의 다음 달 (처음이면 이번 달)
  const thisMonth = firstOfMonth(today);
  const lastStart = done.map((a) => a.startDate).sort(compareISODates).at(-1);
  const nextMonth = lastStart ? addMonthsClamped(firstOfMonth(lastStart), 1) : thisMonth;
  const nextIsDue = compareISODates(nextMonth, thisMonth) <= 0;

  const steps: ChecklistStep[] = Array.from({ length: blades }, (_, i) => {
    const monthlyOutlay = perAccount * (i + 1);
    if (i < done.length) {
      return { index: i, status: 'done', month: firstOfMonth(done[i].startDate), account: done[i], monthlyOutlay };
    }
    const offset = i - done.length;
    return {
      index: i,
      status: offset > 0 ? 'locked' : nextIsDue ? 'now' : 'scheduled',
      // 늦어진 단계는 이번 달에 바로 가입하도록 안내한다.
      month: addMonthsClamped(nextIsDue ? thisMonth : nextMonth, offset),
      monthlyOutlay,
    };
  });

  return { steps, perAccount, termMonths: blades, doneCount: done.length, complete: done.length >= blades };
}
