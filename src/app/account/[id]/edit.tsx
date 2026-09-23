import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { AccountForm } from '../../../components/AccountForm';
import { useAccounts } from '../../../store/AccountsContext';
import type { NewAccountInput } from '../../../types/account';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accounts, editAccount, settings } = useAccounts();

  const account = useMemo(() => accounts.find((a) => a.id === id), [accounts, id]);
  const knownBanks = useMemo(() => Array.from(new Set(accounts.map((a) => a.bank))), [accounts]);

  async function handleSubmit(input: NewAccountInput) {
    if (!account) return;
    await editAccount(account.id, input);
    router.back();
  }

  if (!account) return null;

  return (
    <AccountForm
      initial={account}
      knownBanks={knownBanks}
      defaultTaxType={settings.defaultTaxType}
      submitLabel="수정 완료"
      onSubmit={handleSubmit}
    />
  );
}
