import { parseISODate } from './calc';

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
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
