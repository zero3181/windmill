import type { Account } from '../types/account';
import { parseISODate } from './calc';

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 금액을 '10만 원', '120만 원'처럼 읽기 쉽게. 만 원 단위로 나누어 떨어지지 않으면 원 단위로. */
export function formatManwon(n: number): string {
  return n >= 10_000 && n % 10_000 === 0 ? `${(n / 10_000).toLocaleString('ko-KR')}만\u00A0원` : formatWon(n);
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function formatDateShort(iso: string): string {
  const { m, d } = parseISODate(iso);
  return `${m}월 ${d}일`;
}

export function formatDateFull(iso: string): string {
  const { y, m, d } = parseISODate(iso);
  return `${y}년 ${m}월 ${d}일`;
}

export function formatDday(days: number): string {
  if (days === 0) return 'D-day';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

/** '10월', 올해가 아니면 '2027년 1월' */
export function formatMonth(iso: string, today: string): string {
  const { y, m } = parseISODate(iso);
  return y === parseISODate(today).y ? `${m}월` : `${y}년 ${m}월`;
}

/** 목록 부제: 은행 · 금리. 초보 모드에서 비워 둔 항목은 뺀다. */
export function accountSubtitle(account: Pick<Account, 'bank' | 'rate'>, extra?: string): string {
  return [account.bank, account.rate > 0 ? formatPercent(account.rate) : undefined, extra].filter(Boolean).join(' · ');
}
