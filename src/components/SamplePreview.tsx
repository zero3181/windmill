import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { todayKST } from '../lib/calc';
import { selectWindmill, withFinancials } from '../lib/homeSelectors';
import { buildSampleAccounts } from '../lib/sampleData';
import { radius, spacing } from '../theme';
import { WindmillCard } from './WindmillCard';
import { WindmillHero } from './WindmillHero';

/**
 * 계좌가 하나도 없을 때 홈 아래에 보여 주는 미리보기: 다 채워져 돌아가는 풍차와 그래프.
 * 실제 데이터가 아니라는 것을 '샘플 데이터' 표시로 덮어 알리고, 누를 수 없게 한다.
 */
export function SamplePreview() {
  const today = todayKST();
  const windmill = useMemo(
    () => selectWindmill(withFinancials(buildSampleAccounts(today), today), 'savings', today, 12),
    [today]
  );

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLabel="샘플 데이터 미리보기">
      <View style={styles.preview}>
        <WindmillHero blades={12} filled={windmill.filledBlades} type="savings" />
        <WindmillCard windmill={windmill} type="savings" size={12} sample emptyLabel="" />
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>샘플 데이터</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  preview: {
    gap: spacing.xl - 4,
    opacity: 0.55,
    // 위쪽에 '샘플 데이터' 표시가 들어갈 자리를 비워 풍차를 가리지 않게 한다.
    paddingTop: 44,
  },
  badge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
