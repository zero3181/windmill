import type { Account, AccountType, TaxType } from '../types/account';
import { addMonthsClamped, computeMaturityDate, todayKST } from './calc';

interface SampleSpec {
  /** 오늘로부터 몇 개월 뒤에 만기가 오는지 */
  offsetMonths: number;
  bank: string;
  type: AccountType;
  amount: number;
  rate: number;
  taxType: TaxType;
  termMonths: number;
}

const SPECS: SampleSpec[] = [
  { offsetMonths: 0, bank: '카카오뱅크', type: 'savings', amount: 300_000, rate: 4.2, taxType: 'preferential', termMonths: 12 },
  { offsetMonths: 1, bank: 'OK저축은행', type: 'deposit', amount: 3_000_000, rate: 3.6, taxType: 'general', termMonths: 12 },
  { offsetMonths: 2, bank: '웰컴저축은행', type: 'deposit', amount: 2_000_000, rate: 3.4, taxType: 'general', termMonths: 12 },
  { offsetMonths: 4, bank: '케이뱅크', type: 'savings', amount: 250_000, rate: 3.9, taxType: 'general', termMonths: 12 },
  { offsetMonths: 5, bank: '신한저축은행', type: 'deposit', amount: 4_000_000, rate: 3.5, taxType: 'exempt', termMonths: 12 },
  { offsetMonths: 7, bank: 'SBI저축은행', type: 'deposit', amount: 1_500_000, rate: 3.7, taxType: 'general', termMonths: 12 },
  { offsetMonths: 9, bank: '하나은행', type: 'savings', amount: 400_000, rate: 4.0, taxType: 'preferential', termMonths: 12 },
  { offsetMonths: 11, bank: '우리은행', type: 'deposit', amount: 3_500_000, rate: 3.3, taxType: 'general', termMonths: 12 },
];

/**
 * 계좌가 하나도 없을 때 홈 화면 미리보기용 예시 데이터.
 * 오늘 날짜를 기준으로 매번 다시 계산되므로 앱을 언제 열어도 자연스럽게 보인다.
 * id가 'sample-'로 시작하는 계좌는 실제 DB에 저장되지 않는 화면 전용 데이터다.
 */
export function buildSampleAccounts(today: string = todayKST()): Account[] {
  const now = new Date().toISOString();
  return SPECS.map((spec, idx) => {
    const startDate = addMonthsClamped(today, spec.offsetMonths - spec.termMonths);
    const maturityDate = computeMaturityDate(startDate, spec.termMonths);
    return {
      id: `sample-${idx}`,
      name: `${idx + 1}회차`,
      bank: spec.bank,
      type: spec.type,
      amount: spec.amount,
      rate: spec.rate,
      taxType: spec.taxType,
      startDate,
      termMonths: spec.termMonths,
      maturityDate,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function isSampleAccount(id: string): boolean {
  return id.startsWith('sample-');
}
