import type { AccountType, TaxType } from '../types/account';

/** 풍차 날개 수 = 가입 기간(개월) = 채울 계좌 수 */
export type WindmillSize = 6 | 12;
export const WINDMILL_SIZES: WindmillSize[] = [6, 12];

/** 풍차 만들기에서 정한 목표. 날개 수와 금액만 정하면 나머지(계좌당 금액·가입 일정)는 계산한다. */
export interface WindmillGoal {
  blades: WindmillSize;
  /** 적금: 풍차가 다 돌 때 매달 넣는 총액, 예금: 총 예치금 */
  total: number;
}

export interface AppSettings {
  notifyD7: boolean;
  notifyDday: boolean;
  notifyPayday: boolean;
  defaultTaxType: TaxType;
  /** 첫 실행 소개(OOBE)를 봤는지 */
  onboardingDone: boolean;
  /** 적금 풍차 / 예금 풍차 각각의 날개 수 */
  windmillSize: Record<AccountType, WindmillSize>;
  /** 적금 풍차 / 예금 풍차 각각의 목표 (아직 만들지 않았으면 없음) */
  goals: Partial<Record<AccountType, WindmillGoal>>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifyD7: true,
  notifyDday: true,
  notifyPayday: true,
  defaultTaxType: 'general',
  onboardingDone: false,
  windmillSize: { savings: 12, deposit: 12 },
  goals: {},
};

export function goalSettingKey(type: AccountType): string {
  return `goal.${type}`;
}

function parseGoal(raw: string | undefined): WindmillGoal | undefined {
  if (!raw) return undefined;
  try {
    const { blades, total } = JSON.parse(raw);
    if ((blades === 6 || blades === 12) && typeof total === 'number' && total > 0) return { blades, total };
  } catch {
    // 잘못 저장된 값은 목표가 없는 것으로 본다.
  }
  return undefined;
}

export function serializeGoal(goal: WindmillGoal | undefined): string {
  return goal ? JSON.stringify(goal) : '';
}

function parseSize(raw: string | undefined, fallback: WindmillSize): WindmillSize {
  return raw === '6' ? 6 : raw === '12' ? 12 : fallback;
}

export function parseSettings(raw: Record<string, string>): AppSettings {
  return {
    notifyD7: raw.notifyD7 ? raw.notifyD7 === '1' : DEFAULT_SETTINGS.notifyD7,
    notifyDday: raw.notifyDday ? raw.notifyDday === '1' : DEFAULT_SETTINGS.notifyDday,
    notifyPayday: raw.notifyPayday ? raw.notifyPayday === '1' : DEFAULT_SETTINGS.notifyPayday,
    defaultTaxType: (raw.defaultTaxType as TaxType) || DEFAULT_SETTINGS.defaultTaxType,
    onboardingDone: raw.onboardingDone ? raw.onboardingDone === '1' : DEFAULT_SETTINGS.onboardingDone,
    windmillSize: {
      savings: parseSize(raw['windmillSize.savings'], DEFAULT_SETTINGS.windmillSize.savings),
      deposit: parseSize(raw['windmillSize.deposit'], DEFAULT_SETTINGS.windmillSize.deposit),
    },
    goals: {
      savings: parseGoal(raw[goalSettingKey('savings')]),
      deposit: parseGoal(raw[goalSettingKey('deposit')]),
    },
  };
}

export function boolToSetting(value: boolean): string {
  return value ? '1' : '0';
}
