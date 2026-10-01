import type { Account, AccountType } from '../types/account';
import { addMonthsClamped, computeMaturityDate, todayKST } from './calc';

/** 샘플 풍차: 매달 하나씩 가입한 1년 적금(또는 예금) 12개라 날개가 모두 차서 돌아간다. */
const SAMPLE_BANKS = ['토스뱅크', '카카오뱅크', 'KB국민은행', '신한은행', '하나은행', '우리은행', 'SBI저축은행', 'OK저축은행', '웰컴저축은행', 'NH농협은행', '케이뱅크', 'IBK기업은행'];
const SAMPLE_RATES = [4.2, 4.1, 4.0, 3.9, 4.2, 3.8, 4.0, 4.1, 3.9, 4.0, 3.8, 4.2];

/**
 * 계좌가 하나도 없을 때 홈 화면 미리보기용 예시 데이터.
 * 오늘 날짜를 기준으로 매번 다시 계산되므로 앱을 언제 열어도 자연스럽게 보인다.
 * id가 'sample-'로 시작하는 계좌는 실제 DB에 저장되지 않는 화면 전용 데이터다.
 */
export function buildSampleAccounts(today: string = todayKST(), type: AccountType = 'savings'): Account[] {
  const now = new Date().toISOString();
  return SAMPLE_BANKS.map((bank, idx) => {
    // 11개월 전부터 이번 달까지 매달 하나씩 가입: 만기가 다음 달부터 매달 돌아온다.
    const startDate = addMonthsClamped(today, idx - 11);
    return {
      id: `sample-${idx}`,
      name: `${idx + 1}회차`,
      bank,
      type,
      // 적금은 계좌 하나에 월 10만 원, 예금은 1천만 원
      amount: type === 'savings' ? 100_000 : 10_000_000,
      rate: type === 'savings' ? SAMPLE_RATES[idx] : Math.round((SAMPLE_RATES[idx] - 0.8) * 10) / 10,
      taxType: 'general',
      startDate,
      termMonths: 12,
      maturityDate: computeMaturityDate(startDate, 12),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function isSampleAccount(id: string): boolean {
  return id.startsWith('sample-');
}
