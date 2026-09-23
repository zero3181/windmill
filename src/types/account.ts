export type AccountType = 'deposit' | 'savings';

export type TaxType = 'general' | 'preferential' | 'exempt';

export type AccountStatus = 'active' | 'matured' | 'closed';

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  /** 예금: 예치 원금, 적금: 월 납입액. 원 단위 정수. */
  amount: number;
  /** 연 이율, % 단위, 소수점 둘째 자리까지 (예: 3.5) */
  rate: number;
  taxType: TaxType;
  /** ISO date string (YYYY-MM-DD) */
  startDate: string;
  termMonths: number;
  /** ISO date string (YYYY-MM-DD), startDate + termMonths 로 자동 계산되지만 수정 가능 */
  maturityDate: string;
  /** 적금만 사용, 1~31 */
  payDay?: number;
  status: AccountStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewAccountInput = Omit<
  Account,
  'id' | 'maturityDate' | 'status' | 'createdAt' | 'updatedAt'
> & {
  maturityDate?: string;
};

export const TAX_RATES: Record<TaxType, number> = {
  general: 0.154,
  preferential: 0.095,
  exempt: 0,
};

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  general: '일반과세 15.4%',
  preferential: '세금우대 9.5%',
  exempt: '비과세 0%',
};
