import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccounts } from '../store/AccountsContext';
import { colors, radius, spacing } from '../theme';

const PAGE_COUNT = 2;

const BENEFITS: { icon: SymbolViewProps['name']; title: string; body: string }[] = [
  { icon: { ios: 'calendar', android: 'calendar_month' }, title: '매달 목돈이 돌아와요', body: '급하게 돈이 필요해도 전부 깨지 않고, 그달 만기분만 쓰면 돼요.' },
  { icon: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' }, title: '금리 변화에 덜 흔들려요', body: '매달 그때 금리로 새로 가입하니, 금리가 오르면 바로 반영돼요.' },
  { icon: { ios: 'leaf', android: 'eco' }, title: '저축이 습관이 돼요', body: '매달 하나씩 늘어나는 계좌를 보며 꾸준히 모을 수 있어요.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { settings, updateSettings } = useAccounts();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const isLast = page === PAGE_COUNT - 1;

  // 소개가 끝나면(건너뛰어도) 바로 풍차 만들기로 간다. 이미 풍차가 있으면 홈으로 돌아간다.
  async function finish() {
    await updateSettings({ onboardingDone: true });
    // 소개를 닫는 애니메이션 중에 새 화면을 열면 무시되어서, 소개 자리를 풍차 만들기로 바로 바꾼다.
    if (!settings.goals.savings && !settings.goals.deposit) router.replace('/create-windmill');
    else router.back();
  }

  function goNext() {
    scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.topBar}>
        {!isLast && (
          <Pressable onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>건너뛰기</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={styles.pager}
      >
        <Page
          width={width}
          title="풍차돌리기란?"
          body={'매달 예·적금을 하나씩 새로 가입해서\n1년 뒤부터 매달 만기를 받는 저축법이에요.'}
          below={<BenefitList />}
        />

        <Page
          width={width}
          title="날개 수와 금액만 정하세요"
          body={'매달 무엇을 가입하면 되는지\n할 일 목록으로 알려드려요.'}
        >
          <View style={styles.calcExample}>
            <Text style={styles.calcLine}>날개 12개 · 매달 120만 원</Text>
            <Text style={styles.calcArrow}>↓</Text>
            <Text style={styles.calcResult}>이번 달 할 일: 월 10만 원 1년 적금 가입</Text>
          </View>
        </Page>
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: PAGE_COUNT }, (_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {isLast ? (
          <Pressable style={styles.primaryButton} onPress={finish}>
            <Text style={styles.primaryButtonText}>풍차 만들기</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>다음</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Page({
  width,
  title,
  body,
  children,
  below,
}: {
  width: number;
  title: string;
  body?: string;
  children?: React.ReactNode;
  /** 제목 아래에 놓을 내용 (그림 대신 목록을 보여 줄 때) */
  below?: React.ReactNode;
}) {
  return (
    <View style={[styles.page, { width }]}>
      {children && <View style={styles.visual}>{children}</View>}
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {below}
    </View>
  );
}

function BenefitList() {
  return (
    <View style={styles.benefits}>
      {BENEFITS.map((b) => (
        <View key={b.title} style={styles.benefit}>
          <View style={styles.benefitIcon}>
            <SymbolView name={b.icon} size={22} tintColor={colors.primary} fallback={null} />
          </View>
          <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>{b.title}</Text>
            <Text style={styles.benefitBody}>{b.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}



const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.card,
  },
  topBar: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  skip: {
    fontSize: 15,
    color: colors.textMuted,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  visual: {
    height: 200,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.md,
  },
  benefits: {
    alignSelf: 'stretch',
    gap: spacing.xl,
    marginTop: spacing.xxl,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  benefitBody: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  calcExample: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  calcLine: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  calcArrow: {
    fontSize: 20,
    color: colors.textFaint,
    marginVertical: spacing.xs,
  },
  calcResult: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 50,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
