import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Account, AccountStatus, AccountType, TaxType } from '../types/account';
import { todayKST } from './calc';

const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  accounts: Account[];
  settings: Record<string, string>;
}

export async function exportBackup(
  accounts: Account[],
  settings: Record<string, string>
): Promise<void> {
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    accounts,
    settings,
  };

  const file = new File(Paths.cache, `pungcha-backup-${todayKST()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('이 기기에서는 파일을 공유할 수 없어요.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: '풍차 백업 파일 내보내기',
    UTI: 'public.json',
  });
}

const ACCOUNT_TYPES: AccountType[] = ['deposit', 'savings'];
const TAX_TYPES: TaxType[] = ['general', 'preferential', 'exempt'];
const STATUSES: AccountStatus[] = ['active', 'matured', 'closed'];

function isValidAccount(value: unknown): value is Account {
  if (!value || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    typeof a.bank === 'string' &&
    ACCOUNT_TYPES.includes(a.type as AccountType) &&
    typeof a.amount === 'number' &&
    typeof a.rate === 'number' &&
    TAX_TYPES.includes(a.taxType as TaxType) &&
    typeof a.startDate === 'string' &&
    typeof a.termMonths === 'number' &&
    typeof a.maturityDate === 'string' &&
    STATUSES.includes(a.status as AccountStatus) &&
    typeof a.createdAt === 'string' &&
    typeof a.updatedAt === 'string'
  );
}

/** 파일 선택 → 검증까지 마친 백업 데이터를 반환한다. 사용자가 선택을 취소하면 null. */
export async function pickAndParseBackup(): Promise<BackupPayload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const raw = await new File(result.assets[0].uri).text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('백업 파일을 읽지 못했어요. 풍차돌리기에서 내보낸 파일인지 확인해 주세요.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as BackupPayload).accounts)
  ) {
    throw new Error('백업 파일을 읽지 못했어요. 풍차돌리기에서 내보낸 파일인지 확인해 주세요.');
  }

  const payload = parsed as BackupPayload;
  if (!payload.accounts.every(isValidAccount)) {
    throw new Error('백업 파일 속 계좌 정보를 읽지 못했어요.');
  }

  return {
    version: payload.version ?? 1,
    exportedAt: payload.exportedAt ?? '',
    accounts: payload.accounts,
    settings: payload.settings ?? {},
  };
}
