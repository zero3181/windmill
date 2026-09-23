import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDday, formatPercent, formatWon } from '../lib/format';
import type { AccountWithFinancials } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { colors, radius, spacing } from '../theme';

export function AccountListItem({ item }: { item: AccountWithFinancials }) {
  const router = useRouter();
  const { account, financials } = item;
  const isOverdue = financials.daysToMaturity < 0;
  const isSample = isSampleAccount(account.id);

  return (
    <Pressable
      style={styles.row}
      onPress={() => !isSample && router.push(`/account/${account.id}`)}
    >
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {account.name}
          </Text>
          <Text style={styles.typeTag}>{account.type === 'deposit' ? '예금' : '적금'}</Text>
        </View>
        <Text style={styles.sub}>
          {account.bank} · {formatPercent(account.rate)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.dday, isOverdue && styles.ddayOverdue]}>
          {formatDday(financials.daysToMaturity)}
        </Text>
        <Text style={styles.amount}>{formatWon(financials.maturityPayout)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  main: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  typeTag: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  sub: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  dday: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  ddayOverdue: {
    color: colors.danger,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
});
