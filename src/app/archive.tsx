import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AccountListItem } from '../components/AccountListItem';
import { GroupedSection, ListRow } from '../components/ui/Grouped';
import { todayKST } from '../lib/calc';
import { withFinancials } from '../lib/homeSelectors';
import { useAccounts } from '../store/AccountsContext';
import { spacing } from '../theme';

export default function ArchiveScreen() {
  const { accounts } = useAccounts();
  const ended = useMemo(
    () =>
      withFinancials(
        accounts.filter((a) => a.status !== 'active'),
        todayKST()
      ).sort((a, b) => b.account.updatedAt.localeCompare(a.account.updatedAt)),
    [accounts]
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <GroupedSection>
        {ended.length === 0 && <ListRow title="종료된 계좌가 없어요" />}
        {ended.map((item) => (
          <AccountListItem key={item.account.id} item={item} />
        ))}
      </GroupedSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
  },
});
