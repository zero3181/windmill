import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDday, formatWon } from '../lib/format';
import type { ThisMonth } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { colors, radius, spacing } from '../theme';

export function ThisMonthSection({ thisMonth }: { thisMonth: ThisMonth }) {
  const router = useRouter();
  const hasNothing = thisMonth.maturing.length === 0 && thisMonth.savingsDue.length === 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>이번 달</Text>

      {hasNothing ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>이번 달은 챙길 게 없어요</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {thisMonth.maturing.map(({ account, financials }, idx) => (
            <Pressable
              key={account.id}
              style={[styles.row, idx > 0 && styles.rowDivider]}
              onPress={() => !isSampleAccount(account.id) && router.push(`/account/${account.id}`)}
            >
              <View style={styles.ddayBadge}>
                <Text style={styles.ddayText}>{formatDday(financials.daysToMaturity)}</Text>
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{account.name} 만기</Text>
                <Text style={styles.rowSub}>{account.bank}</Text>
              </View>
              <Text style={styles.rowAmount}>{formatWon(financials.maturityPayout)}</Text>
            </Pressable>
          ))}

          {thisMonth.savingsDue.length > 0 && (
            <View style={[styles.row, thisMonth.maturing.length > 0 && styles.rowDivider]}>
              <View style={[styles.ddayBadge, styles.savingsBadge]}>
                <Text style={[styles.ddayText, styles.savingsText]}>납입</Text>
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>이번 달 적금 납입</Text>
                <Text style={styles.rowSub}>{thisMonth.savingsDue.length}건</Text>
              </View>
              <Text style={styles.rowAmount}>{formatWon(thisMonth.savingsSum)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emptyText: {
    padding: spacing.lg,
    color: colors.textMuted,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ddayBadge: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  savingsBadge: {
    backgroundColor: colors.primarySoft,
  },
  savingsText: {
    color: colors.primary,
  },
  ddayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
