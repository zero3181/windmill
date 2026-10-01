import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import uuid from 'react-native-uuid';
import { computeMaturityDate, todayKST } from '../lib/calc';
import {
  deleteAccount as dbDeleteAccount,
  deleteAllAccounts,
  getAllSettings,
  insertAccount,
  listAccounts,
  setSetting,
  updateAccount as dbUpdateAccount,
} from '../lib/db';
import { rescheduleAllNotifications } from '../lib/notifications';
import {
  boolToSetting,
  DEFAULT_SETTINGS,
  goalSettingKey,
  parseSettings,
  serializeGoal,
  type AppSettings,
} from '../lib/settings';
import type { Account, NewAccountInput } from '../types/account';

interface AccountsContextValue {
  accounts: Account[];
  settings: AppSettings;
  loading: boolean;
  addAccount: (input: NewAccountInput) => Promise<void>;
  editAccount: (id: string, input: NewAccountInput) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  /** 계좌를 끝낸다: 만기 전에 닫으면 'closed'(중도 해지), 만기에 닫으면 'matured'(만기 해지) */
  closeAccount: (id: string, status?: 'closed' | 'matured') => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  restoreFromBackup: (accounts: Account[], settings: Record<string, string>) => Promise<void>;
  refresh: () => Promise<void>;
  rawSettings: Record<string, string>;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rawSettings, setRawSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const settings = useMemo(() => parseSettings(rawSettings), [rawSettings]);

  const refresh = useCallback(async () => {
    const [rows, settingsRows] = await Promise.all([listAccounts(db), getAllSettings(db)]);
    setAccounts(rows);
    setRawSettings(settingsRows);
  }, [db]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    rescheduleAllNotifications(accounts, settings).catch(() => {
      // 알림 권한 거부 등은 조용히 무시 - 홈 사용에는 영향 없음
    });
  }, [accounts, settings, loading]);

  const addAccount = useCallback(
    async (input: NewAccountInput) => {
      const now = new Date().toISOString();
      const account: Account = {
        ...input,
        id: uuid.v4() as string,
        maturityDate: input.maturityDate || computeMaturityDate(input.startDate, input.termMonths),
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await insertAccount(db, account);
      await refresh();
    },
    [db, refresh]
  );

  const editAccount = useCallback(
    async (id: string, input: NewAccountInput) => {
      const existing = accounts.find((a) => a.id === id);
      if (!existing) return;
      const updated: Account = {
        ...existing,
        ...input,
        maturityDate: input.maturityDate || computeMaturityDate(input.startDate, input.termMonths),
        updatedAt: new Date().toISOString(),
      };
      await dbUpdateAccount(db, updated);
      await refresh();
    },
    [db, accounts, refresh]
  );

  const removeAccount = useCallback(
    async (id: string) => {
      await dbDeleteAccount(db, id);
      await refresh();
    },
    [db, refresh]
  );

  const closeAccount = useCallback(
    async (id: string, status: 'closed' | 'matured' = 'closed') => {
      const existing = accounts.find((a) => a.id === id);
      if (!existing) return;
      await dbUpdateAccount(db, { ...existing, status, updatedAt: new Date().toISOString() });
      await refresh();
    },
    [db, accounts, refresh]
  );

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const merged = { ...settings, ...patch };
      await Promise.all([
        setSetting(db, 'notifyD7', boolToSetting(merged.notifyD7)),
        setSetting(db, 'notifyDday', boolToSetting(merged.notifyDday)),
        setSetting(db, 'notifyPayday', boolToSetting(merged.notifyPayday)),
        setSetting(db, 'defaultTaxType', merged.defaultTaxType),
        setSetting(db, 'onboardingDone', boolToSetting(merged.onboardingDone)),
        setSetting(db, 'windmillSize.savings', String(merged.windmillSize.savings)),
        setSetting(db, 'windmillSize.deposit', String(merged.windmillSize.deposit)),
        setSetting(db, goalSettingKey('savings'), serializeGoal(merged.goals.savings)),
        setSetting(db, goalSettingKey('deposit'), serializeGoal(merged.goals.deposit)),
        setSetting(db, 'stepReminder.savings', boolToSetting(merged.stepReminder.savings)),
        setSetting(db, 'stepReminder.deposit', boolToSetting(merged.stepReminder.deposit)),
      ]);
      await refresh();
    },
    [db, settings, refresh]
  );

  const restoreFromBackup = useCallback(
    async (backupAccounts: Account[], backupSettings: Record<string, string>) => {
      await deleteAllAccounts(db);
      for (const account of backupAccounts) {
        await insertAccount(db, account);
      }
      await Promise.all(
        Object.entries(backupSettings).map(([key, value]) => setSetting(db, key, value))
      );
      await refresh();
    },
    [db, refresh]
  );

  const value: AccountsContextValue = {
    accounts,
    settings,
    loading,
    addAccount,
    editAccount,
    removeAccount,
    closeAccount,
    updateSettings,
    restoreFromBackup,
    refresh,
    rawSettings,
  };

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
}

export { DEFAULT_SETTINGS, todayKST };
