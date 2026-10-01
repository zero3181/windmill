import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { todayKST } from '../lib/calc';
import { selectWindmill, withFinancials } from '../lib/homeSelectors';
import { buildSampleAccounts } from '../lib/sampleData';
import { radius, spacing } from '../theme';
import { WindmillCard } from './WindmillCard';
import { WindmillHero } from './WindmillHero';

/** 도장 잉크색: 약간 바랜 빨강 */
const STAMP_RED = 'rgba(224, 49, 49, 0.82)';

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
      {/* 미리보기 위에 비스듬히 찍힌 도장: 풍차와 그래프에 걸쳐 실제 데이터가 아님을 알린다 */}
      <View style={styles.stampLayer}>
        <View style={styles.stamp}>
          <View style={styles.stampInner}>
            <Text style={styles.stampText}>샘플 데이터</Text>
          </View>
        </View>
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
    opacity: 0.6,
  },
  // 풍차 아래쪽과 그래프 카드 위쪽에 걸치도록, 풍차 높이쯤에 찍는다.
  stampLayer: {
    position: 'absolute',
    top: 170,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stamp: {
    transform: [{ rotate: '-14deg' }],
    borderWidth: 4,
    borderColor: STAMP_RED,
    borderRadius: radius.md,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  stampInner: {
    borderWidth: 1.5,
    borderColor: STAMP_RED,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  stampText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    color: STAMP_RED,
  },
});
