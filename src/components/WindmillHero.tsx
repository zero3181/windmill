import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import type { AccountType } from '../types/account';
import { Windmill } from './Windmill';

/** 홈 맨 위의 큰 풍차. 누르면 각 날개가 몇 월인지 보여 준다. */
export function WindmillHero({
  blades,
  filled,
  type,
  months,
  showMonths: showMonthsProp,
}: {
  blades: number;
  filled: number[];
  type: AccountType;
  /** 날개 자리마다 붙일 달 이름 (selectWindmill의 bladeMonths) */
  months?: number[];
  /** 바깥(홈의 패럴랙스 스크롤)에서 월 숫자 표시를 정할 때 */
  showMonths?: boolean;
}) {
  // 풍차를 누르면 각 날개가 몇 월인지 잠깐 보여 준다.
  const [showMonths, setShowMonths] = useState(false);
  useEffect(() => {
    if (!showMonths) return;
    const t = setTimeout(() => setShowMonths(false), 3000);
    return () => clearTimeout(t);
  }, [showMonths]);

  return (
    <View style={styles.hero}>
      <Pressable
        onPress={() => setShowMonths(true)}
        accessibilityRole="button"
        accessibilityHint="각 날개가 몇 월인지 보여 줘요"
      >
        <Windmill blades={blades} filled={filled} width={238} type={type} months={months} showMonths={showMonthsProp ?? showMonths} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
});
