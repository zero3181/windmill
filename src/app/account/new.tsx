import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { AccountForm } from '../../components/AccountForm';
import { useAccounts } from '../../store/AccountsContext';
import type { NewAccountInput } from '../../types/account';

export default function NewAccountScreen() {
  const router = useRouter();
  const { accounts, addAccount, settings } = useAccounts();
  const params = useLocalSearchParams<{ prefill?: string }>();

  const knownBanks = useMemo(() => Array.from(new Set(accounts.map((a) => a.bank))), [accounts]);

  const prefill = useMemo(() => {
    if (!params.prefill) return undefined;
    try {
      return JSON.parse(params.prefill);
    } catch {
      return undefined;
    }
  }, [params.prefill]);

  async function handleSubmit(input: NewAccountInput) {
    await addAccount(input);
    router.back();
  }

  return (
    <AccountForm
      initial={prefill}
      knownBanks={knownBanks}
      defaultTaxType={settings.defaultTaxType}
      submitLabel="계좌 저장"
      onSubmit={handleSubmit}
    />
  );
}
