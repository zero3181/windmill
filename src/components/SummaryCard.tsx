import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatWon } from '../lib/format';
import type { Summary } from '../lib/homeSelectors';
import { colors, radius, spacing } from '../theme';

export function SummaryCard({ summary }: { summary: Summary }) {
  const [showAfterTax, setShowAfterTax] = useState(true);

  const preTaxPayout = summary.totalMaturityPayout + summary.totalTaxAmount;
  const bigNumber = showAfterTax ? summary.totalMaturityPayout : preTaxPayout;

  return (
    <Pressable style={styles.card} onPress={() => setShowAfterTax((v) => !v)}>
      <Text style={styles.label}>
        {showAfterTax ? '만기 시 세후 예상 수령액' : '만기 시 세전 예상 수령액'} · 탭하여 전환
      </Text>
      <Text style={styles.bigNumber}>{formatWon(bigNumber)}</Text>
      <View style={styles.row}>
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>현재 모은 원금</Text>
          <Text style={styles.subValue}>{formatWon(summary.totalPrincipal)}</Text>
        </View>
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>진행 중 계좌</Text>
          <Text style={styles.subValue}>{summary.activeCount}개</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  bigNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  subItem: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    color: colors.textFaint,
    marginBottom: 2,
  },
  subValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
