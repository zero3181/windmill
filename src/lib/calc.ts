import { Account, TAX_RATES } from '../types/account';

/** ISO date string, always YYYY-MM-DD (no time component). */
export type ISODate = string;

interface YMD {
  y: number;
  m: number; // 1-indexed
  d: number;
}

export function parseISODate(s: ISODate): YMD {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

export function toISODate(y: number, m: number, d: number): ISODate {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function daysInMonth(y: number, m: number): number {
  // Date.UTC(y, m, 0) = day 0 of the (0-indexed) month `m`,
  // i.e. the last day of the 1-indexed month `m`.
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 오늘 날짜를 한국 시간(Asia/Seoul) 기준 YYYY-MM-DD 문자열로 반환한다. */
export function todayKST(now: Date = new Date()): ISODate {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/** startDate + months, 말일 보정 포함 (예: 1/31 + 1개월 = 2/28 또는 2/29). */
export function addMonthsClamped(startDate: ISODate, months: number): ISODate {
  const { y, m, d } = parseISODate(startDate);
  const totalMonthIndex = (m - 1) + months;
  const newYear = y + Math.floor(totalMonthIndex / 12);
  const newMonth = ((totalMonthIndex % 12) + 12) % 12 + 1;
  const dim = daysInMonth(newYear, newMonth);
  const newDay = Math.min(d, dim);
  return toISODate(newYear, newMonth, newDay);
}

/** 같은 연/월에 day만 바꾼 날짜, 말일 보정 포함. */
export function withDay(date: ISODate, day: number): ISODate {
  const { y, m } = parseISODate(date);
  const dim = daysInMonth(y, m);
  return toISODate(y, m, Math.min(day, dim));
}

export function compareISODates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** a - b, 일(day) 단위. 달력일 기준 정확한 차이를 위해 UTC epoch 사용. */
export function diffInDays(a: ISODate, b: ISODate): number {
  const { y: ay, m: am, d: ad } = parseISODate(a);
  const { y: by, m: bm, d: bd } = parseISODate(b);
  const aUTC = Date.UTC(ay, am - 1, ad);
  const bUTC = Date.UTC(by, bm - 1, bd);
  return Math.round((aUTC - bUTC) / 86400000);
}

/** date + days (음수 가능), 달력일 기준. */
export function addDays(date: ISODate, days: number): ISODate {
  const { y, m, d } = parseISODate(date);
  const utc = Date.UTC(y, m - 1, d) + days * 86400000;
  const dt = new Date(utc);
  return toISODate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function computeMaturityDate(startDate: ISODate, termMonths: number): ISODate {
  return addMonthsClamped(startDate, termMonths);
}

/** 가입일부터 오늘까지 도래한 적금 납입 회차 수 (termMonths 상한). */
export function countElapsedInstallments(
  startDate: ISODate,
  payDay: number,
  termMonths: number,
  today: ISODate
): number {
  const base = withDay(startDate, payDay);
  let count = 0;
  for (let k = 0; k < termMonths; k++) {
    const dueDate = addMonthsClamped(base, k);
    if (compareISODates(dueDate, today) <= 0) {
      count = k + 1;
    } else {
      break;
    }
  }
  return count;
}

export function taxRateFor(account: Pick<Account, 'taxType'>): number {
  return TAX_RATES[account.taxType];
}

export interface AccountFinancials {
  maturityDate: ISODate;
  /** 세전 이자 (원 미만 절사) */
  grossInterest: number;
  /** 세금 (원 미만 절사) */
  taxAmount: number;
  /** 세후 이자 */
  afterTaxInterest: number;
  /** 현재까지 납입/예치된 원금 */
  currentPrincipal: number;
  /** 만기 시 세후 총 수령액 (원금 + 세후 이자) */
  maturityPayout: number;
  /** 오늘부터 만기까지 남은 일수 (음수면 만기 경과) */
  daysToMaturity: number;
}

export function calcAccountFinancials(
  account: Pick<Account, 'type' | 'amount' | 'rate' | 'taxType' | 'startDate' | 'termMonths' | 'payDay' | 'maturityDate'>,
  today: ISODate = todayKST()
): AccountFinancials {
  const { type, amount, rate, startDate, termMonths, payDay, maturityDate } = account;
  const taxRate = taxRateFor(account);
  const r = rate / 100;

  let grossInterest: number;
  let principalAtMaturity: number;
  let currentPrincipal: number;

  if (type === 'deposit') {
    grossInterest = Math.floor(amount * r * (termMonths / 12));
    principalAtMaturity = amount;
    currentPrincipal = amount;
  } else {
    grossInterest = Math.floor(
      amount * (r / 12) * (termMonths * (termMonths + 1)) / 2
    );
    principalAtMaturity = amount * termMonths;
    const day = payDay ?? parseISODate(startDate).d;
    const elapsed = countElapsedInstallments(startDate, day, termMonths, today);
    currentPrincipal = amount * elapsed;
  }

  const taxAmount = Math.floor(grossInterest * taxRate);
  const afterTaxInterest = grossInterest - taxAmount;
  const maturityPayout = principalAtMaturity + afterTaxInterest;
  const resolvedMaturityDate = maturityDate || computeMaturityDate(startDate, termMonths);
  const daysToMaturity = diffInDays(resolvedMaturityDate, today);

  return {
    maturityDate: resolvedMaturityDate,
    grossInterest,
    taxAmount,
    afterTaxInterest,
    currentPrincipal,
    maturityPayout,
    daysToMaturity,
  };
}
