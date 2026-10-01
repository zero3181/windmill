import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { todayKST } from '../lib/calc';
import { selectWindmill, withFinancials } from '../lib/homeSelectors';
import { buildSampleAccounts } from '../lib/sampleData';
import { radius, spacing } from '../theme';
import { WindmillCard } from './WindmillCard';
import { WindmillHero } from './WindmillHero';

/** 도장 잉크색: 약간 바랜 검정 */
const STAMP_INK = 'rgba(0, 0, 0, 0.78)';

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
      </View>
      {/* 그래프 카드 한가운데에 비스듬히 찍힌 도장: 풍차는 가리지 않고 실제 데이터가 아님을 알린다 */}
      <View>
        <View style={styles.preview}>
          <WindmillCard windmill={windmill} type="savings" size={12} sample emptyLabel="" />
        </View>
        <View style={styles.stampLayer}>
          <View style={styles.stamp}>
            <View style={styles.stampInner}>
              <Text style={styles.stampText}>SAMPLE</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl - 4,
  },
  preview: {
    opacity: 0.6,
  },
  stampLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    transform: [{ rotate: '-14deg' }],
    borderWidth: 4,
    borderColor: STAMP_INK,
    borderRadius: radius.md,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  stampInner: {
    borderWidth: 1.5,
    borderColor: STAMP_INK,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  stampText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    color: STAMP_INK,
  },
});
