import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatWon } from '../lib/format';
import type { TimelineMonth } from '../lib/homeSelectors';
import { colors, radius, spacing } from '../theme';

const BAR_MAX_HEIGHT = 96;
const HERO_BAR_MAX_HEIGHT = 140;
const BAR_MIN_HEIGHT = 6;

interface Props {
  months: TimelineMonth[];
  /** 온보딩용 강조 카드 형태. 더 크고, 상단에 총계 헤드라인이 붙는다. */
  hero?: boolean;
  /** false면 막대를 탭해도 월별 상세로 이동하지 않는다 (예시 데이터용). */
  interactive?: boolean;
}

export function TimelineChart({ months, hero = false, interactive = true }: Props) {
  const router = useRouter();
  const maxTotal = Math.max(1, ...months.map((m) => m.total));
  const barMaxHeight = hero ? HERO_BAR_MAX_HEIGHT : BAR_MAX_HEIGHT;
  const filledMonths = months.filter((m) => m.total > 0);
  const peakKey = filledMonths.reduce(
    (peak, m) => (m.total > (peak?.total ?? -1) ? m : peak),
    null as TimelineMonth | null
  )?.key;

  const chart = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {months.map((month) => {
        const isEmpty = month.total === 0;
        const barHeight = isEmpty
          ? BAR_MIN_HEIGHT
          : Math.max(BAR_MIN_HEIGHT, (month.total / maxTotal) * barMaxHeight);
        return (
          <Pressable
            key={month.key}
            style={[styles.col, hero && styles.colHero]}
            onPress={() => interactive && !isEmpty && router.push(`/month/${month.key}`)}
          >
            {hero && month.key === peakKey && (
              <Text style={styles.peakLabel}>{formatWon(month.total)}</Text>
            )}
            <View style={[styles.barTrack, { height: barMaxHeight }]}>
              <View
                style={[
                  styles.bar,
                  hero && styles.barHero,
                  { height: barHeight },
                  isEmpty ? styles.barEmpty : styles.barFilled,
                ]}
              />
            </View>
            <Text style={[styles.monthLabel, hero && styles.monthLabelHero]}>{month.month}월</Text>
            {!isEmpty && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  if (!hero) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionTitle}>12개월 타임라인</Text>
        {chart}
      </View>
    );
  }

  const totalAmount = filledMonths.reduce((sum, m) => sum + m.total, 0);

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>12개월 만기 흐름</Text>
        <View style={styles.sampleBadge}>
          <Text style={styles.sampleBadgeText}>예시</Text>
        </View>
      </View>
      <Text style={styles.heroHeadline}>
        {filledMonths.length}개월에 만기 · 총 {formatWon(totalAmount)}
      </Text>
      {chart}
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
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sampleBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  sampleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  heroHeadline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  col: {
    alignItems: 'center',
    width: 40,
  },
  colHero: {
    width: 44,
  },
  peakLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  barTrack: {
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: radius.sm,
  },
  barHero: {
    width: 24,
  },
  barFilled: {
    backgroundColor: colors.primary,
  },
  barEmpty: {
    backgroundColor: colors.barEmpty,
    borderWidth: 1,
    borderColor: '#DADEE6',
    borderStyle: 'dashed',
  },
  monthLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  monthLabelHero: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});
