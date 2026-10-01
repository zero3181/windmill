import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { todayKST } from '../lib/calc';
import { selectWindmill, withFinancials } from '../lib/homeSelectors';
import { buildSampleAccounts } from '../lib/sampleData';
import { radius, spacing } from '../theme';
import type { AccountType } from '../types/account';
import { Segmented } from './ui/Controls';
import { WindmillCard } from './WindmillCard';
import { WindmillHero } from './WindmillHero';

/** 도장 잉크색: 약간 바랜 검정 */
const STAMP_INK = 'rgba(0, 0, 0, 0.78)';

/**
 * 계좌가 하나도 없을 때 홈 아래에 보여 주는 미리보기. 데이터가 있을 때의 홈과 같은 순서로
 * 다 채워져 돌아가는 풍차, 적금/예금 풍차 전환, 그래프를 보여 준다.
 * 전체 가운데에 'SAMPLE' 도장을 찍어 실제 데이터가 아님을 알린다. 전환만 누를 수 있다.
 */
export function SamplePreview() {
  const today = todayKST();
  const [type, setType] = useState<AccountType>('savings');
  const windmill = useMemo(
    () => selectWindmill(withFinancials(buildSampleAccounts(today, type), today), type, today, 12),
    [today, type]
  );

  return (
    <View style={styles.wrap} accessibilityLabel="샘플 데이터 미리보기">
      <View style={styles.dim} pointerEvents="none">
        <WindmillHero blades={12} filled={windmill.filledBlades} type={type} />
      </View>
      <Segmented
        options={[
          { value: 'savings', label: '적금 풍차' },
          { value: 'deposit', label: '예금 풍차' },
        ]}
        value={type}
        onChange={setType}
      />
      <View style={styles.dim} pointerEvents="none">
        <WindmillCard windmill={windmill} type={type} size={12} sample emptyLabel="" />
      </View>

      {/* 풍차와 그래프 전체의 가운데에 비스듬히 찍힌 도장. 아래 전환은 그대로 누를 수 있다. */}
      <View style={styles.stampLayer} pointerEvents="none">
        <View style={styles.stamp}>
          <View style={styles.stampInner}>
            <Text style={styles.stampText}>SAMPLE</Text>
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
  dim: {
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
