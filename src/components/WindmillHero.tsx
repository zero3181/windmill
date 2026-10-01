import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { allBlades, bladeMonth } from '../lib/blades';
import { colors, spacing } from '../theme';
import type { AccountType } from '../types/account';
import { Windmill } from './Windmill';

/** 비어 있는 달이 이만큼 이하로 남으면 어느 달인지 알려 준다. (6날개는 한 자리가 두 달을 뜻해 이름을 붙이지 않는다) */
const NAME_MISSING_UP_TO = 3;

/** 홈 맨 위의 큰 풍차와 한 줄 안내. */
export function WindmillHero({ blades, filled, type }: { blades: number; filled: number[]; type: AccountType }) {
  const filledSet = new Set(filled);
  const missing = allBlades(blades)
    .filter((p) => !filledSet.has(p))
    .map((p) => bladeMonth(p, blades))
    .sort((a, b) => a - b);

  const caption =
    missing.length === 0
      ? '풍차 완성! 이제 매달 만기가 돌아와요'
      : filledSet.size === 0
        ? '가입한 계좌의 만기월 자리에 날개가 생겨요'
        : blades === 12 && missing.length <= NAME_MISSING_UP_TO
          ? `${missing.map((m) => `${m}월`).join('·')} 날개만 채우면 풍차가 돌아가요`
          : `날개 ${filledSet.size}/${blades} · 만기월이 다른 계좌로 날개를 채워 보세요`;

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
        <Windmill blades={blades} filled={filled} width={238} type={type} showMonths={showMonths} />
      </Pressable>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  caption: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
});
