import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { addMonthsClamped, parseISODate } from '../lib/calc';
import { formatWon } from '../lib/format';
import type { Windmill } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { WINDMILL_SIZES, type WindmillSize } from '../lib/settings';
import { colors, radius, spacing } from '../theme';
import { Card } from './ui/Grouped';
import { bladeColor, Windmill as WindmillArt } from './Windmill';

const MIN_MONTH_WIDTH = 12;
const ROW_HEIGHT = 16;
const BAR_HEIGHT = 10;

interface Props {
  windmill: Windmill;
  /** 풍차 날개 수 (6 또는 12개월) */
  size: WindmillSize;
  /** 없으면 날개 수 토글을 숨긴다 (풍차 목표가 있으면 날개 수는 풍차 수정에서 바꾼다) */
  onSizeChange?: (size: WindmillSize) => void;
  /** 예시 데이터일 때 '예시' 배지를 붙이고 막대를 눌러도 이동하지 않는다. */
  sample?: boolean;
  emptyLabel: string;
}

/** 내 풍차 요약: 총 개수 · 원금 · 만기월마다 날개가 채워지는 풍차 · 가입월~만기월 계단 그래프. */
export function WindmillCard({ windmill, size, onSizeChange, sample = false, emptyLabel }: Props) {
  const filled = Math.min(windmill.maturityMonthCount, size);
  const [artWidth, setArtWidth] = useState(0);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.countRow}>
            <Text style={styles.count}>총 {windmill.count}개</Text>
            {sample && (
              <View style={styles.sampleBadge}>
                <Text style={styles.sampleBadgeText}>예시</Text>
              </View>
            )}
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>원금</Text>
            <Text style={styles.amount}>{formatWon(windmill.totalPrincipal)}</Text>
          </View>
        </View>
        {onSizeChange && (
          <View style={styles.sizeToggle}>
            {WINDMILL_SIZES.map((s) => (
              <Pressable
                key={s}
                style={[styles.sizeOption, s === size && styles.sizeOptionSelected]}
                onPress={() => onSizeChange(s)}
                accessibilityRole="button"
                accessibilityState={{ selected: s === size }}
              >
                <Text style={[styles.sizeText, s === size && styles.sizeTextSelected]}>{s}개월</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.art} onLayout={(e) => setArtWidth(Math.min(240, e.nativeEvent.layout.width * 0.72))}>
        {artWidth > 0 && <WindmillArt blades={size} filled={filled} width={artWidth} />}
      </View>

      {windmill.bars.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <GanttChart windmill={windmill} blades={size} interactive={!sample} />
      )}
    </Card>
  );
}

/** 가입월~만기월 막대. 막대마다 자기가 채우는 풍차 날개와 같은 색을 쓴다. */
function GanttChart({ windmill, blades, interactive }: { windmill: Windmill; blades: number; interactive: boolean }) {
  const router = useRouter();
  const [viewWidth, setViewWidth] = useState(0);
  const { bars, monthCount, rangeStart } = windmill;

  const monthWidth = Math.max(MIN_MONTH_WIDTH, viewWidth / monthCount);
  const contentWidth = monthWidth * monthCount;
  const chartHeight = bars.length * ROW_HEIGHT;
  const todayX = windmill.today * monthWidth;
  const initialScrollX = Math.max(0, Math.min(todayX - viewWidth / 2, contentWidth - viewWidth));

  const months = Array.from({ length: monthCount }, (_, i) => parseISODate(addMonthsClamped(rangeStart, i)));

  return (
    <View style={styles.chartWrap} onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}>
      {viewWidth > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentOffset={{ x: initialScrollX, y: 0 }}>
          <View style={{ width: contentWidth }}>
            <View style={styles.axis}>
              {months.map(({ y, m }, i) =>
                // 분기 첫 달마다 라벨을 달되, 차트 첫 달 라벨과 겹치지 않게 바로 다음 달은 건너뛴다.
                i === 0 || ((m - 1) % 3 === 0 && i >= 2) ? (
                  <Pressable
                    key={`${y}-${m}`}
                    style={[styles.axisLabel, { left: i * monthWidth }]}
                    hitSlop={8}
                    disabled={!interactive}
                    onPress={() => router.push(`/month/${y}-${String(m).padStart(2, '0')}`)}
                  >
                    <Text style={styles.axisText}>{i === 0 || m === 1 ? `'${String(y).slice(2)}.${m}` : `${m}월`}</Text>
                  </Pressable>
                ) : null
              )}
            </View>

            <View style={{ height: chartHeight }}>
              {months.map(({ y, m }, i) =>
                (m - 1) % 3 === 0 ? <View key={`grid-${y}-${m}`} style={[styles.gridLine, { left: i * monthWidth }]} /> : null
              )}

              {bars.map((bar, row) => {
                const { account } = bar.item;
                const left = bar.start * monthWidth;
                const width = Math.max(BAR_HEIGHT, (bar.end - bar.start) * monthWidth);
                const elapsed = Math.min(Math.max(windmill.today - bar.start, 0), bar.end - bar.start) * monthWidth;
                return (
                  <Pressable
                    key={account.id}
                    hitSlop={{ top: 3, bottom: 3 }}
                    style={[
                      styles.bar,
                      {
                        top: row * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2,
                        left,
                        width,
                        backgroundColor: bladeColor(bar.bladeIndex, blades, 0.18),
                      },
                    ]}
                    disabled={!interactive || isSampleAccount(account.id)}
                    onPress={() => router.push(`/account/${account.id}`)}
                  >
                    <View style={[styles.barElapsed, { width: elapsed, backgroundColor: bladeColor(bar.bladeIndex, blades) }]} />
                  </Pressable>
                );
              })}

              <View style={[styles.todayLine, { left: todayX }]} pointerEvents="none" />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  sizeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.barEmpty,
    borderRadius: radius.full,
    padding: 3,
  },
  sizeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  sizeOptionSelected: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sizeTextSelected: {
    color: colors.text,
  },
  art: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  sampleBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sampleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  amountLabel: {
    fontSize: 15,
    color: colors.textMuted,
  },
  amount: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  chartWrap: {
    marginTop: spacing.lg,
  },
  axis: {
    height: 20,
  },
  axisLabel: {
    position: 'absolute',
    top: 0,
  },
  axisText: {
    fontSize: 11,
    color: colors.textFaint,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  barElapsed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  todayLine: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: colors.danger,
  },
});
