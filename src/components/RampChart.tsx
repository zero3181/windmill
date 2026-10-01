import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatManwon } from '../lib/format';
import { colors, radius, spacing } from '../theme';

/**
 * 적금 풍차에서 매달 넣는 돈이 늘어나는 모습: 가입한 계좌 수만큼 막대가 커지다
 * 날개 수째 달부터 그대로 간다. 1년 뒤 부담을 미리 보여 주려는 그림이다.
 */
export function RampChart({ perAccount, blades }: { perAccount: number; blades: number }) {
  return (
    <View style={styles.wrap} accessibilityLabel={`첫 달 ${formatManwon(perAccount)}, ${blades}개월째부터 매달 ${formatManwon(perAccount * blades)}`}>
      <View style={styles.bars}>
        {Array.from({ length: blades }, (_, i) => (
          <View
            key={i}
            style={[styles.bar, { height: `${((i + 1) / blades) * 100}%` }, i === blades - 1 && styles.barLast]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>첫 달 {formatManwon(perAccount)}</Text>
        <Text style={styles.labelLast}>
          {blades}개월째부터 매달 {formatManwon(perAccount * blades)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bars: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: radius.sm / 2,
    borderTopRightRadius: radius.sm / 2,
    backgroundColor: colors.primarySoft,
  },
  barLast: {
    backgroundColor: colors.primary,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  labelLast: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
