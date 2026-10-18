import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BenefitList } from '../components/BenefitList';
import { Card } from '../components/ui/Grouped';
import { bladeColor, Windmill } from '../components/Windmill';
import { allBlades } from '../lib/blades';
import { colors, radius, spacing } from '../theme';

/** 계단 그림에 그리는 가입 수 (1월~6월). 그 뒤는 같은 모양이 이어진다. */
const STAIR_ROWS = 6;
/** 계단 그림의 가로 칸: 올해 12달 + 내년 6달 */
const STAIR_COLS = 18;

/** 메뉴의 '풍차돌리기란?': 풍차돌리기의 개념과 장점을 그림과 함께 설명한다. */
export default function GuideScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Windmill blades={12} filled={allBlades(12)} width={200} />
        <Text style={styles.heroTitle}>매달 만기가 돌아오는 저축법</Text>
        <Text style={styles.heroBody}>
          풍차돌리기는 매달 예·적금을 하나씩 새로 가입해서, 1년 뒤부터 매달 만기를 받는 방법이에요.
        </Text>
      </View>

      <Step n={1} title="매달 하나씩 가입해요">
        <StairDiagram />
        <Text style={styles.body}>1년 만기 적금을 1월, 2월, 3월…처럼 매달 하나씩 새로 가입해요.</Text>
      </Step>

      <Step n={2} title="1년 뒤부터 매달 만기가 돌아와요">
        <MaturityStrip />
        <Text style={styles.body}>
          12달 동안 가입을 이어 가면, 다음 해에는 매달 계좌 하나씩 만기돼요. 받은 돈으로 다시 가입하면 풍차가 계속
          돌아요.
        </Text>
      </Step>

      <Step n={3} title="날개 하나가 만기 한 달이에요">
        <View style={styles.center}>
          <Windmill blades={12} filled={[1, 2, 3, 4, 5]} width={220} showMonths />
        </View>
        <Text style={styles.body}>
          앱의 풍차 날개는 만기가 돌아오는 달이에요. 만기월이 다른 계좌를 가입할 때마다 그 달 날개가 채워지고, 12개가
          다 차면 풍차가 돌아가요.
        </Text>
      </Step>

      <Card>
        <Text style={styles.cardTitle}>왜 좋을까요?</Text>
        <BenefitList style={styles.benefits} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>적금 풍차와 예금 풍차</Text>
        <View style={styles.kinds}>
          <Kind
            type="savings"
            title="적금 풍차"
            body="매달 조금씩 넣는 적금을 매달 하나씩 가입해요. 월급에서 꾸준히 모을 때 좋아요."
            note="계좌가 늘수록 매달 넣는 돈도 늘어서, 12개월째에는 첫 달의 12배가 돼요."
          />
          <Kind
            type="deposit"
            title="예금 풍차"
            body="모아 둔 목돈을 나눠 매달 하나씩 예금해요. 필요할 때 그달 만기분만 꺼내 쓰기 좋아요."
          />
        </View>
      </Card>

      <Text style={styles.footer}>
        날개 수와 금액만 정하면, 이번 달에 무엇을 가입하면 되는지 할 일로 알려 드려요.
      </Text>
    </ScrollView>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText} maxFontSizeMultiplier={1.4}>
            {n}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

/** 매달 시작하는 1년짜리 막대가 계단처럼 쌓여, 내년 같은 달에 끝나는 모습 */
function StairDiagram() {
  return (
    <View
      style={styles.stair}
      accessible
      accessibilityRole="image"
      accessibilityLabel="1월부터 매달 가입한 1년 적금이 내년 1월부터 차례로 만기되는 그림"
    >
      <View style={styles.stairAxis}>
        <Text style={[styles.axisText, { width: `${(12 / STAIR_COLS) * 100}%` }]}>올해</Text>
        <Text style={styles.axisText}>내년</Text>
      </View>
      <View>
        {/* 올해와 내년 사이 경계선 */}
        <View style={[styles.yearLine, { left: `${(12 / STAIR_COLS) * 100}%` }]} />
        {Array.from({ length: STAIR_ROWS }, (_, i) => (
          <View key={i} style={styles.stairRow}>
            <View
              style={[
                styles.stairBar,
                {
                  left: `${(i / STAIR_COLS) * 100}%`,
                  width: `${(12 / STAIR_COLS) * 100}%`,
                  backgroundColor: bladeColor(i * 2, 12),
                },
              ]}
            >
              <Text style={styles.stairStart} maxFontSizeMultiplier={1.2}>
                {i + 1}월 가입
              </Text>
              <Text style={styles.stairEnd} maxFontSizeMultiplier={1.2}>
                {i + 1}월 만기
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 내년 1~12월에 하나씩 돌아오는 만기 */
function MaturityStrip() {
  return (
    <View
      style={styles.strip}
      accessible
      accessibilityRole="image"
      accessibilityLabel="내년 1월부터 12월까지 매달 만기가 하나씩 돌아오는 그림"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <View key={i} style={styles.stripCell}>
          <View style={[styles.coin, { backgroundColor: bladeColor(i, 12) }]}>
            <Text style={styles.coinText} maxFontSizeMultiplier={1.2}>
              {i + 1}
            </Text>
          </View>
          <Text style={styles.coinLabel} maxFontSizeMultiplier={1.2}>
            월
          </Text>
        </View>
      ))}
    </View>
  );
}

function Kind({
  type,
  title,
  body,
  note,
}: {
  type: 'savings' | 'deposit';
  title: string;
  body: string;
  note?: string;
}) {
  return (
    <View style={styles.kind}>
      <Windmill blades={12} filled={allBlades(12)} width={84} type={type} />
      <View style={styles.kindText}>
        <Text style={styles.kindTitle}>{title}</Text>
        <Text style={styles.kindBody}>{body}</Text>
        {note && <Text style={styles.kindNote}>{note}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heroBody: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    minWidth: 26,
    minHeight: 26,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  center: {
    alignItems: 'center',
  },
  stair: {
    marginVertical: spacing.md,
    gap: 6,
  },
  stairAxis: {
    flexDirection: 'row',
  },
  axisText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  yearLine: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 1.5,
    backgroundColor: colors.border,
  },
  stairRow: {
    height: 26,
    marginBottom: 4,
  },
  stairBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stairStart: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stairEnd: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  stripCell: {
    alignItems: 'center',
    gap: 2,
  },
  coin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coinLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  benefits: {
    marginTop: spacing.md,
  },
  kinds: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  kindText: {
    flex: 1,
    gap: 2,
  },
  kindTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  kindBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  kindNote: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.warning,
    marginTop: 2,
  },
  footer: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
