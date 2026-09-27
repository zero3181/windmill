import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { accountSubtitle, formatDday } from '../lib/format';
import type { AccountWithFinancials } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { colors } from '../theme';
import { ListRow } from './ui/Grouped';

export function AccountListItem({ item }: { item: AccountWithFinancials }) {
  const router = useRouter();
  const { account, financials } = item;
  const isSample = isSampleAccount(account.id);
  const status = account.status === 'closed' ? '해지' : account.status === 'matured' ? '만기' : formatDday(financials.daysToMaturity);

  return (
    <ListRow
      title={account.name}
      subtitle={accountSubtitle(account) || undefined}
      detail={status}
      detailStyle={account.status === 'active' && financials.daysToMaturity < 0 ? styles.overdue : undefined}
      chevron={!isSample}
      onPress={isSample ? undefined : () => router.push(`/account/${account.id}`)}
    />
  );
}

const styles = StyleSheet.create({
  overdue: {
    color: colors.danger,
  },
});
