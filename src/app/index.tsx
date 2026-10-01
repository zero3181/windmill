import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountListItem } from '../components/AccountListItem';
import { EmptyState } from '../components/EmptyState';
import { SamplePreview } from '../components/SamplePreview';
import { PrimaryButton, Segmented } from '../components/ui/Controls';
import { Card, GroupedSection, ListRow } from '../components/ui/Grouped';
import { WindmillCard } from '../components/WindmillCard';
import { WindmillChecklist } from '../components/WindmillChecklist';
import { Toast } from '../components/Toast';
import { WindmillHero } from '../components/WindmillHero';
import { fitsWindmill } from '../lib/blades';
import { compareISODates, todayKST } from '../lib/calc';
import { buildChecklist, type ChecklistStep } from '../lib/checklist';
import { notifyUndoable, onSavedFeedback, successHaptic, type Feedback } from '../lib/feedback';
import { selectWindmill, withFinancials } from '../lib/homeSelectors';
import { useAccounts } from '../store/AccountsContext';
import { useWindmillType } from '../store/WindmillTypeContext';
import { colors, spacing } from '../theme';
import type { Account, AccountType } from '../types/account';

const TYPE_LABEL = { savings: '적금', deposit: '예금' } as const;
const TYPES: AccountType[] = ['savings', 'deposit'];
/** iOS 내비게이션 바 높이 (홈은 투명 헤더라 그 아래부터 내용을 둔다) */
const NAV_BAR_HEIGHT = 52;

export default function HomeScreen() {
  const router = useRouter();
  const { accounts, loading, settings, updateSettings, closeAccount, reopenAccount } = useAccounts();
  const { type, setType } = useWindmillType();
  const today = todayKST();
  const onboardingShown = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  /** 투명 헤더(… 버튼) 아래에서 시작한다 */
  const topOffset = insets.top + NAV_BAR_HEIGHT;
  const [scrollY] = useState(() => new Animated.Value(0));
  const [heroHeight, setHeroHeight] = useState(0);
  const [showMonths, setShowMonths] = useState(false);
  useEffect(() => {
    if (!showMonths) return;
    const t = setTimeout(() => setShowMonths(false), 3000);
    return () => clearTimeout(t);
  }, [showMonths]);
  const [toast, setToast] = useState<{ feedback: Feedback | null; id: number }>({ feedback: null, id: 0 });

  // 가입을 기록하고 돌아오면 맨 위로 올려 날개가 자라는 모습을 보여 주고, 안내와 진동을 낸다.
  useEffect(
    () =>
      onSavedFeedback((feedback) => {
        setToast((t) => ({ feedback, id: t.id + 1 }));
        // 가입을 기록했을 때만 맨 위로 올려 날개가 자라는 모습을 보여 주고 진동을 낸다.
        if (!feedback.undo) {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          successHaptic(feedback.celebrate);
        }
      }),
    []
  );

  useEffect(() => {
    if (loading || settings.onboardingDone || onboardingShown.current) return;
    onboardingShown.current = true;
    router.push('/onboarding');
  }, [loading, settings.onboardingDone, router]);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.status === 'active'), [accounts]);
  const endedCount = accounts.length - activeAccounts.length;

  // 풍차 목표가 있거나 계좌가 있는 종류만 보여 준다. 둘 다 있을 때만 적금/예금 전환이 나타난다.
  const typesInUse = useMemo(
    () => TYPES.filter((t) => settings.goals[t] || activeAccounts.some((a) => a.type === t)),
    [settings.goals, activeAccounts]
  );
  const showTypeSwitch = typesInUse.length > 1;
  useEffect(() => {
    if (typesInUse.length === 1 && typesInUse[0] !== type) setType(typesInUse[0]);
  }, [typesInUse, type, setType]);

  const goal = settings.goals[type];
  const blades = goal?.blades ?? settings.windmillSize[type];

  const items = useMemo(() => withFinancials(activeAccounts, today), [activeAccounts, today]);
  const typeItems = useMemo(
    () =>
      items
        .filter((i) => i.account.type === type)
        .sort((a, b) => a.financials.daysToMaturity - b.financials.daysToMaturity),
    [items, type]
  );
  const windmill = useMemo(() => selectWindmill(items, type, today, blades), [items, type, today, blades]);
  const checklist = useMemo(
    () => (goal ? buildChecklist(goal, type, activeAccounts, today) : null),
    [goal, type, activeAccounts, today]
  );

  // 만기일이 지났는데 아직 해지를 기록하지 않은 계좌: 할 일 맨 위에서 먼저 정리하게 한다.
  const matured = useMemo(
    () =>
      activeAccounts
        .filter((a) => a.type === type && compareISODates(a.maturityDate, today) <= 0)
        .sort((a, b) => compareISODates(a.maturityDate, b.maturityDate)),
    [activeAccounts, type, today]
  );

  async function handleRenew(account: Account) {
    await closeAccount(account.id, 'matured');
    // 만기로 빈 날개 자리를 같은 조건으로 다시 채운다.
    const prefill = { type, amount: checklist?.perAccount ?? account.amount, termMonths: checklist?.termMonths ?? account.termMonths };
    router.push({
      pathname: '/add-account',
      params: { prefill: JSON.stringify(prefill), step: String(Math.max(1, checklist?.doneCount ?? 1)) },
    });
  }

  function handleJoin(step: ChecklistStep) {
    const prefill = { type, amount: checklist?.perAccount, termMonths: checklist?.termMonths };
    router.push({ pathname: '/add-account', params: { prefill: JSON.stringify(prefill), step: String(step.index + 1) } });
  }

  function handleFindProducts(step: ChecklistStep) {
    router.push({
      pathname: '/rates',
      params: {
        type,
        term: String(checklist?.termMonths ?? blades),
        step: String(step.index + 1),
        amount: String(checklist?.perAccount ?? ''),
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const otherType = TYPES.find((t) => t !== type)!;
  const hasData = typesInUse.length > 0;
  const todoFirst = matured.length > 0 || Boolean(checklist?.steps.some((st) => st.status === 'now'));

  const summaryCard = (
    <WindmillCard
      windmill={windmill}
      type={type}
      size={blades}
      onSizeChange={
        goal
          ? undefined
          : (size) => updateSettings({ windmillSize: { ...settings.windmillSize, [type]: size } })
      }
      emptyLabel={`첫 ${TYPE_LABEL[type]}을 가입하면 여기에 가입~만기 그래프가 생겨요`}
    />
  );

  const todoSection = checklist ? (
      <WindmillChecklist
        checklist={checklist}
        type={type}
        today={today}
        onJoin={handleJoin}
        onFindProducts={handleFindProducts}
        onOpenAccount={(id) => router.push(`/account/${id}`)}
        reminderDate={settings.stepReminder[type]}
        matured={matured}
        onRenew={handleRenew}
        onCloseMatured={async (account) => {
          await closeAccount(account.id, 'matured');
          notifyUndoable('만기 해지했어요', () => reopenAccount(account.id));
        }}
        onReminder={(step) =>
          router.push({
            pathname: '/step-reminder',
            params: { type, month: step.month, step: String(step.index + 1) },
          })
        }
      />
    ) : (
      <Card style={styles.goalPrompt}>
        <Text style={styles.goalTitle}>할 일 안내 받기</Text>
        <Text style={styles.goalBody}>날개 수와 금액만 정하면 할 일을 알려드려요.</Text>
        <PrimaryButton
          label="풍차 만들기"
          onPress={() => router.push({ pathname: '/create-windmill', params: { type } })}
        />
      </Card>
    );

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="더 보기">
          {goal && (
            <Stack.Toolbar.MenuAction
              icon="slider.horizontal.3"
              onPress={() => router.push({ pathname: '/create-windmill', params: { type } })}
            >
              {`${TYPE_LABEL[type]} 풍차 수정`}
            </Stack.Toolbar.MenuAction>
          )}
          {typesInUse.length > 0 && !settings.goals[otherType] && (
            <Stack.Toolbar.MenuAction icon="plus" onPress={() => router.push('/create-windmill')}>
              {`${TYPE_LABEL[otherType]} 풍차도 만들기`}
            </Stack.Toolbar.MenuAction>
          )}
          <Stack.Toolbar.MenuAction icon="square.and.pencil" onPress={() => router.push('/add-account')}>
            계좌 직접 등록
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="gearshape" onPress={() => router.push('/settings')}>
            설정
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      {hasData && (
        // 풍차는 뒤쪽 층에 고정: 스크롤하면 절반 속도로 올라가며 흐려지고, 아래 시트가 덮는다.
        <Animated.View
          pointerEvents="none"
          onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
          style={[
            styles.heroLayer,
            {
              top: topOffset,
              opacity: scrollY.interpolate({ inputRange: [0, heroHeight || 1], outputRange: [1, 0.2], extrapolate: 'clamp' }),
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-200, 0, heroHeight || 1],
                    outputRange: [100, 0, -(heroHeight || 1) * 0.5],
                    extrapolateRight: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <WindmillHero blades={blades} filled={windmill.filledBlades} type={type} showMonths={showMonths} />
        </Animated.View>
      )}

      <Animated.ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="never"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingTop: topOffset }}
      >
        {hasData ? (
          <>
            {/* 풍차가 비쳐 보이는 빈칸. 누르면 각 날개가 몇 월인지 보여 준다. */}
            <Pressable
              style={{ height: heroHeight }}
              onPress={() => setShowMonths(true)}
              accessibilityRole="button"
              accessibilityLabel="풍차"
              accessibilityHint="각 날개가 몇 월인지 보여 줘요"
            />
            <View style={[styles.sheet, { minHeight: windowHeight }]}>
              {showTypeSwitch && (
                <Segmented
                  options={[
                    { value: 'savings', label: '적금 풍차' },
                    { value: 'deposit', label: '예금 풍차' },
                  ]}
                  value={type}
                  onChange={setType}
                />
              )}

              {/* 이번 달에 할 일이나 만기된 계좌가 있으면 할 일을 그래프보다 먼저 보여 준다 */}
              {todoFirst && todoSection}
              {summaryCard}
              {!todoFirst && todoSection}


              {typeItems.length > 0 && (
                <GroupedSection title={`내 ${TYPE_LABEL[type]} ${typeItems.length}개`}>
                  {typeItems.map((item) => (
                    <AccountListItem key={item.account.id} item={item} outsideWindmill={!fitsWindmill(item.account, blades)} />
                  ))}
                </GroupedSection>
              )}

            {endedCount > 0 && (
              <GroupedSection>
                <ListRow title="종료된 계좌" detail={`${endedCount}개`} chevron onPress={() => router.push('/archive')} />
              </GroupedSection>
            )}
            </View>
          </>
        ) : (
          <View style={styles.content}>
            <EmptyState />
            <SamplePreview />
            {endedCount > 0 && (
              <GroupedSection>
                <ListRow title="종료된 계좌" detail={`${endedCount}개`} chevron onPress={() => router.push('/archive')} />
              </GroupedSection>
            )}
          </View>
        )}
      </Animated.ScrollView>
      <Toast
        message={toast.feedback?.message ?? null}
        id={toast.id}
        actionLabel={toast.feedback?.undo ? '되돌리기' : undefined}
        onAction={toast.feedback?.undo ? () => void toast.feedback?.undo?.() : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  heroLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // 풍차 위로 덮어 올라오는 판: 배경색을 깔고 위쪽 모서리를 둥글게, 살짝 그림자를 준다.
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  goalPrompt: {
    gap: spacing.sm,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  goalBody: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});
