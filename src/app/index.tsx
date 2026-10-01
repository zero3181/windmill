import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountListItem } from '../components/AccountListItem';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton, Segmented } from '../components/ui/Controls';
import { Card, GroupedSection, ListRow } from '../components/ui/Grouped';
import { WindmillCard } from '../components/WindmillCard';
import { WindmillChecklist } from '../components/WindmillChecklist';
import { WindmillHero } from '../components/WindmillHero';
import { fitsWindmill } from '../lib/blades';
import { todayKST } from '../lib/calc';
import { buildChecklist, type ChecklistStep } from '../lib/checklist';
import { selectWindmill, withFinancials } from '../lib/homeSelectors';
import { useAccounts } from '../store/AccountsContext';
import { useWindmillType } from '../store/WindmillTypeContext';
import { colors, spacing } from '../theme';
import type { AccountType } from '../types/account';

const TYPE_LABEL = { savings: '적금', deposit: '예금' } as const;
const TYPES: AccountType[] = ['savings', 'deposit'];

export default function HomeScreen() {
  const router = useRouter();
  const { accounts, loading, settings, updateSettings } = useAccounts();
  const { type, setType } = useWindmillType();
  const today = todayKST();
  const onboardingShown = useRef(false);

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

  function handleJoin(step: ChecklistStep) {
    const prefill = { type, amount: checklist?.perAccount, termMonths: checklist?.termMonths };
    router.push({ pathname: '/add-account', params: { prefill: JSON.stringify(prefill), step: String(step.index + 1) } });
  }

  function handleFindProducts(step: ChecklistStep) {
    router.push({
      pathname: '/rates',
      params: {
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

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {typesInUse.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <WindmillHero blades={blades} filled={windmill.filledBlades} type={type} />

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

            {checklist ? (
              <WindmillChecklist
                checklist={checklist}
                type={type}
                today={today}
                onJoin={handleJoin}
                onFindProducts={handleFindProducts}
                onOpenAccount={(id) => router.push(`/account/${id}`)}
                reminderDate={settings.stepReminder[type]}
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
            )}

            {typeItems.length > 0 && (
              <GroupedSection title={`내 ${TYPE_LABEL[type]} ${typeItems.length}개`}>
                {typeItems.map((item) => (
                  <AccountListItem key={item.account.id} item={item} outsideWindmill={!fitsWindmill(item.account, blades)} />
                ))}
              </GroupedSection>
            )}
          </>
        )}

        {endedCount > 0 && (
          <GroupedSection>
            <ListRow title="종료된 계좌" detail={`${endedCount}개`} chevron onPress={() => router.push('/archive')} />
          </GroupedSection>
        )}
      </ScrollView>
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
