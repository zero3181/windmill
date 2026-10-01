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
import type { AccountType } from '../types/account';
import { bladeColor } from './Windmill';

const MIN_MONTH_WIDTH = 12;
const ROW_HEIGHT = 26;
const BAR_HEIGHT = 20;

interface Props {
  windmill: Windmill;
  /** 적금/예금: 막대 색을 풍차 색과 맞춘다 */
  type: AccountType;
  /** 풍차 날개 수 (6 또는 12개월) */
  size: WindmillSize;
  /** 없으면 날개 수 토글을 숨긴다 (풍차 목표가 있으면 날개 수는 풍차 수정에서 바꾼다) */
  onSizeChange?: (size: WindmillSize) => void;
  /** 샘플 데이터일 때: 막대를 눌러도 이동하지 않는다 (표시는 SamplePreview가 한다). */
  sample?: boolean;
  emptyLabel: string;
}

/** 내 풍차 요약: 총 개수 · 원금 · 가입월~만기월 계단 그래프. 풍차 그림은 홈 위쪽 WindmillHero에 있다. */
export function WindmillCard({ windmill, type, size, onSizeChange, sample = false, emptyLabel }: Props) {
  return (
    <Card>
      <View style={styles.header}>
        {/* 총 개수와 원금을 한 줄에: 글자 아랫선을 맞춘다 */}
        <View style={styles.headerText}>
          <Text style={styles.count}>총 {windmill.count}개</Text>
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

      {windmill.bars.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <GanttChart windmill={windmill} blades={size} type={type} interactive={!sample} />
      )}
    </Card>
  );
}

/** 가입월~만기월 막대. 막대마다 자기가 채우는 풍차 날개와 같은 색을 쓴다. */
function GanttChart({
  windmill,
  blades,
  type,
  interactive,
}: {
  windmill: Windmill;
  blades: number;
  type: AccountType;
  interactive: boolean;
}) {
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
                // 분기 첫 달마다 라벨을 달되, 차트 첫 달 라벨과 겹치지 않게 두 달 안쪽은 건너뛴다.
                i === 0 || ((m - 1) % 3 === 0 && i >= 3) ? (
                  <Pressable
                    key={`${y}-${m}`}
                    style={[styles.axisLabel, { left: i * monthWidth }]}
                    hitSlop={8}
                    disabled={!interactive}
                    onPress={() => router.push(`/month/${y}-${String(m).padStart(2, '0')}`)}
                  >
                    <Text style={styles.axisText} maxFontSizeMultiplier={1.3}>{i === 0 || m === 1 ? `'${String(y).slice(2)}.${m}` : `${m}월`}</Text>
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
                const sample = isSampleAccount(account.id);
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
                        backgroundColor: barColor(bar.bladeIndex, blades, type, 0.18),
                      },
                    ]}
                    disabled={!interactive || sample}
                    accessibilityRole={interactive && !sample ? 'button' : undefined}
                    accessibilityLabel={barLabel(bar, windmill.today, type)}
                    onPress={() => router.push(`/account/${account.id}`)}
                  >
                    <View style={[styles.barElapsed, { width: elapsed, backgroundColor: barColor(bar.bladeIndex, blades, type) }]} />
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

/** VoiceOver용 막대 이름: "9월 적금, 가입 7개월째, 5개월 남음" */
function barLabel(bar: Windmill['bars'][number], today: number, type: AccountType): string {
  const { account } = bar.item;
  const term = account.termMonths;
  const unit = type === 'savings' ? '적금' : '예금';
  const month = `${parseISODate(account.startDate).m}월 ${unit}`;
  if (today < bar.start) return `${month}, 가입 전`;
  if (today >= bar.end) return `${month}, 만기`;
  const nth = Math.min(term, Math.floor(today - bar.start) + 1);
  const left = Math.max(1, Math.ceil(bar.end - today));
  return `${month}, 가입 ${nth}개월째, ${left}개월 남음`;
}

/** 막대 색: 채우는 날개와 같은 색. 풍차 주기와 기간이 다른 계좌(-1)는 회색. */
function barColor(bladeIndex: number, blades: number, type: AccountType, alpha = 1): string {
  return bladeIndex < 0 ? `rgba(142, 142, 147, ${alpha})` : bladeColor(bladeIndex, blades, alpha, type);
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: spacing.md,
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
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
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
