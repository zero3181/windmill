import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { accountSubtitle, formatDday } from '../lib/format';
import type { AccountWithFinancials } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { colors } from '../theme';
import { ListRow } from './ui/Grouped';

/** outsideWindmill: 가입 기간이 풍차와 달라 날개를 채우지 않는 계좌 */
export function AccountListItem({ item, outsideWindmill = false }: { item: AccountWithFinancials; outsideWindmill?: boolean }) {
  const router = useRouter();
  const { account, financials } = item;
  const isSample = isSampleAccount(account.id);
  const status = account.status === 'closed' ? '중도 해지' : account.status === 'matured' ? '만기 해지' : formatDday(financials.daysToMaturity);

  return (
    <ListRow
      title={account.name}
      subtitle={accountSubtitle(account, outsideWindmill ? `${account.termMonths}개월 · 풍차 밖` : undefined) || undefined}
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
