import type { TaxType } from '../types/account';

export interface AppSettings {
  notifyD7: boolean;
  notifyDday: boolean;
  notifyPayday: boolean;
  defaultTaxType: TaxType;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifyD7: true,
  notifyDday: true,
  notifyPayday: true,
  defaultTaxType: 'general',
};

export function parseSettings(raw: Record<string, string>): AppSettings {
  return {
    notifyD7: raw.notifyD7 ? raw.notifyD7 === '1' : DEFAULT_SETTINGS.notifyD7,
    notifyDday: raw.notifyDday ? raw.notifyDday === '1' : DEFAULT_SETTINGS.notifyDday,
    notifyPayday: raw.notifyPayday ? raw.notifyPayday === '1' : DEFAULT_SETTINGS.notifyPayday,
    defaultTaxType: (raw.defaultTaxType as TaxType) || DEFAULT_SETTINGS.defaultTaxType,
  };
}

export function boolToSetting(value: boolean): string {
  return value ? '1' : '0';
}
