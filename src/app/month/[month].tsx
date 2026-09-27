import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AccountListItem } from '../../components/AccountListItem';
import { Card, GroupedSection, ListRow } from '../../components/ui/Grouped';
import { todayKST } from '../../lib/calc';
import { formatWon } from '../../lib/format';
import { monthKey, withFinancials } from '../../lib/homeSelectors';
import { useAccounts } from '../../store/AccountsContext';
import { colors, spacing } from '../../theme';

export default function MonthScreen() {
  const { month } = useLocalSearchParams<{ month: string }>();
  const { accounts } = useAccounts();
  const [y, m] = (month ?? '').split('-').map(Number);

  const { maturing, paying } = useMemo(() => {
    const active = withFinancials(
      accounts.filter((a) => a.status === 'active'),
      todayKST()
    );
    return {
      maturing: active
        .filter((i) => monthKey(i.financials.maturityDate) === month)
        .sort((a, b) => a.financials.daysToMaturity - b.financials.daysToMaturity),
      // 이 달에 납입 기간이 걸쳐 있는 적금
      paying: active.filter(
        (i) =>
          i.account.type === 'savings' &&
          monthKey(i.account.startDate) <= month! &&
          month! < monthKey(i.financials.maturityDate)
      ),
    };
  }, [accounts, month]);

  const total = maturing.reduce((sum, i) => sum + i.financials.maturityPayout, 0);
  const paySum = paying.reduce((sum, i) => sum + i.account.amount, 0);

  return (
    <>
      <Stack.Screen options={{ title: `${y}년 ${m}월` }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Card style={styles.summary}>
          <Text style={styles.label}>만기 수령액 합계 (세후)</Text>
          <Text style={styles.value}>{formatWon(total)}</Text>
          {paying.length > 0 && <Text style={styles.label}>적금 납입 {paying.length}건 · {formatWon(paySum)}</Text>}
        </Card>
        <GroupedSection title={`만기 ${maturing.length}개`}>
          {maturing.length === 0 && <ListRow title="이 달에 만기되는 계좌가 없어요" />}
          {maturing.map((item) => (
            <AccountListItem key={item.account.id} item={item} />
          ))}
        </GroupedSection>
        {paying.length > 0 && (
          <GroupedSection title={`납입 ${paying.length}건`}>
            {paying.map((item) => (
              <AccountListItem key={item.account.id} item={item} />
            ))}
          </GroupedSection>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  summary: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
