import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountListItem } from '../../components/AccountListItem';
import { todayKST } from '../../lib/calc';
import { monthKey, withFinancials } from '../../lib/homeSelectors';
import { useAccounts } from '../../store/AccountsContext';
import { colors, radius, spacing } from '../../theme';

export default function MonthScreen() {
  const { month } = useLocalSearchParams<{ month: string }>();
  const { accounts } = useAccounts();

  const items = useMemo(() => {
    const active = accounts.filter((a) => a.status === 'active');
    const withFin = withFinancials(active, todayKST());
    return withFin
      .filter((i) => monthKey(i.financials.maturityDate) === month)
      .sort((a, b) => a.financials.daysToMaturity - b.financials.daysToMaturity);
  }, [accounts, month]);

  const total = items.reduce((sum, i) => sum + i.financials.maturityPayout, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{month} 만기 합계</Text>
        <Text style={styles.summaryValue}>{total.toLocaleString('ko-KR')}원</Text>
      </View>
      <View style={styles.listCard}>
        {items.map((item) => (
          <AccountListItem key={item.account.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  summary: {
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  listCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
