import type { AccountType, TaxType } from '../types/account';
import { addMonthsClamped, calcAccountFinancials, computeMaturityDate, type ISODate } from './calc';

/** n의 약수를 오름차순으로. 만기 주기·계좌 개수 선택지로 쓴다. */
export function divisors(n: number): number[] {
  const result: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) result.push(i);
  }
  return result;
}

export interface WindmillPlanInput {
  type: AccountType;
  /** 계좌 하나의 가입 기간 (개월) */
  termMonths: number;
  /** 새 계좌를 여는 간격 = 만기가 돌아오는 간격 (개월), termMonths의 약수 */
  intervalMonths: number;
  /** 적금: 계좌당 월 납입액, 예금: 계좌당 예치금 */
  perAccount: number;
  rate: number;
  taxType: TaxType;
}

export interface WindmillPlan {
  count: number;
  /** 적금: 모든 계좌가 굴러갈 때의 월 납입 총액, 예금: 총 예치금 */
  total: number;
  /** 각 계좌의 가입일 */
  openings: ISODate[];
  /** 각 계좌의 만기일 */
  maturities: ISODate[];
  /** 계좌 하나의 만기 세후 수령액 */
  payoutPerAccount: number;
  afterTaxInterestPerAccount: number;
  totalPayout: number;
  totalAfterTaxInterest: number;
  /** 적금: 월 납입 총액이 total에 도달하는 달 (1부터, 마지막 계좌를 여는 달) */
  fullFromMonth: number;
}

export function planWindmill(input: WindmillPlanInput, startDate: ISODate): WindmillPlan {
  const { type, termMonths, intervalMonths, perAccount, rate, taxType } = input;
  const count = Math.max(1, Math.floor(termMonths / intervalMonths));

  const openings = Array.from({ length: count }, (_, k) => addMonthsClamped(startDate, k * intervalMonths));
  const maturities = openings.map((d) => computeMaturityDate(d, termMonths));

  const financials = calcAccountFinancials(
    { type, amount: perAccount, rate, taxType, startDate, termMonths, maturityDate: maturities[0] },
    startDate
  );

  return {
    count,
    total: perAccount * count,
    openings,
    maturities,
    payoutPerAccount: financials.maturityPayout,
    afterTaxInterestPerAccount: financials.afterTaxInterest,
    totalPayout: financials.maturityPayout * count,
    totalAfterTaxInterest: financials.afterTaxInterest * count,
    fullFromMonth: (count - 1) * intervalMonths + 1,
  };
}
