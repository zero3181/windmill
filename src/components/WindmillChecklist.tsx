import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import type { Checklist, ChecklistStep } from '../lib/checklist';
import { formatDateShort, formatMonth } from '../lib/format';
import { colors, radius, spacing } from '../theme';
import type { Account, AccountType } from '../types/account';
import { LinkButton, PillButton } from './ui/Controls';
import { Chevron } from './ui/Grouped';

interface Props {
  checklist: Checklist;
  type: AccountType;
  today: string;
  /** 지금 할 단계를 눌렀을 때 (가입 등록) */
  onJoin: (step: ChecklistStep) => void;
  onOpenAccount: (accountId: string) => void;
  /** 다음 가입 알림 날짜 (없으면 알림 없음) */
  reminderDate?: string;
  /** 알림 날짜를 고르는 창을 연다 */
  onReminder: (step: ChecklistStep) => void;
  /** 만기일이 지났는데 아직 해지를 기록하지 않은 계좌 (할 일 맨 위에 먼저 보여 준다) */
  matured: Account[];
  /** 만기 해지를 기록하고 같은 조건으로 다시 가입 */
  onRenew: (account: Account) => void;
  /** 만기 해지만 기록 */
  onCloseMatured: (account: Account) => void;
}

const UNIT: Record<AccountType, string> = { savings: '적금', deposit: '예금' };
/** 처음에 보여 줄 앞으로의 단계 수 */
const VISIBLE_PENDING = 3;

/** 풍차를 채우는 할 일 목록. 지금 할 일 하나만 활성화하고, 그다음 단계들은 흐리게 보여 준다. */
export function WindmillChecklist({
  checklist,
  type,
  today,
  onJoin,
  onOpenAccount,
  reminderDate,
  onReminder,
  matured,
  onRenew,
  onCloseMatured,
}: Props) {
  const { steps, doneCount, complete } = checklist;
  // 강조색은 풍차 색을 따른다: 적금은 파랑, 예금은 난색
  const tint: Tint =
    type === 'deposit'
      ? { solid: colors.deposit, soft: colors.depositSoft }
      : { solid: colors.primary, soft: colors.primarySoft };
  const [showDone, setShowDone] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const unit = UNIT[type];

  const done = steps.filter((s) => s.status === 'done');
  const allPending = steps.filter((s) => s.status !== 'done');
  // 앞으로 할 단계는 가까운 몇 개만 보이고 나머지는 접어 둔다.
  const pending = showAllPending ? allPending : allPending.slice(0, VISIBLE_PENDING);
  const hiddenCount = allPending.length - pending.length;
  // 완료한 단계가 여럿이면 한 줄로 접어 둔다.
  const collapseDone = done.length > 1 && !showDone;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{complete ? '풍차 완성!' : '할 일'}</Text>
        <Text style={styles.progress}>
          {doneCount}/{steps.length}
        </Text>
      </View>

      <View style={styles.card}>
        {matured.map((account) => (
          <View key={account.id} style={[styles.row, styles.rowMatured]}>
            <StepIcon name={{ ios: 'calendar.badge.checkmark', android: 'event_available' }} color={colors.warning} />
            <View style={styles.rowMain}>
              <Text style={styles.nowTitle} lineBreakStrategyIOS="hangul-word">
                {Number(account.maturityDate.slice(5, 7))}월 {unit}이 만기됐어요
              </Text>
              <View style={styles.actions}>
                <PillButton label="만기 해지하고 다시 가입" onPress={() => onRenew(account)} />
                <LinkButton label="해지만" onPress={() => onCloseMatured(account)} />
              </View>
            </View>
          </View>
        ))}

        {collapseDone ? (
          <Pressable style={styles.row} onPress={() => setShowDone(true)}>
            <StepIcon name={DONE_ICON} color={tint.solid} />
            <Text style={[styles.doneTitle, styles.rowMain]}>
              1~{done.length}번째 {unit} 가입 완료
            </Text>
            <Chevron direction="down" />
          </Pressable>
        ) : (
          done.map((step) => (
            <Pressable key={step.index} style={styles.row} onPress={() => step.account && onOpenAccount(step.account.id)}>
              <StepIcon name={DONE_ICON} color={tint.solid} />
              <Text style={[styles.doneTitle, styles.rowMain]}>
                {step.index + 1}번째 {unit} 가입 완료
              </Text>
              <Chevron />
            </Pressable>
          ))
        )}

        {pending.map((step) => {
          const month = formatMonth(step.month, today);

          if (step.status === 'now') {
            return (
              // 줄 전체를 누르면 바로 가입 기록 시트가 열린다.
              <Pressable
                key={step.index}
                style={({ pressed }) => [
                  styles.row,
                  styles.rowCentered,
                  { backgroundColor: tint.soft },
                  pressed && styles.rowNowPressed,
                ]}
                onPress={() => onJoin(step)}
                accessibilityRole="button"
                accessibilityHint="가입한 계좌를 기록해요"
                // 줄이 한 덩어리로 읽혀서, 안의 종 버튼은 VoiceOver 동작으로도 열 수 있게 한다
                accessibilityActions={[{ name: 'reminder', label: '가입 알림' }]}
                onAccessibilityAction={(e) => e.nativeEvent.actionName === 'reminder' && onReminder(step)}
              >
                <StepNumber n={step.index + 1} active tint={tint} />
                <Text style={[styles.nowTitle, styles.rowMain]} lineBreakStrategyIOS="hangul-word">
                  {step.index + 1}번째 {unit}을 가입하세요
                </Text>
                <ReminderPill date={reminderDate} month={month} tint={tint} onPress={() => onReminder(step)} />
                <Chevron />
              </Pressable>
            );
          }

          if (step.status === 'scheduled') {
            return (
              <View key={step.index} style={[styles.row, styles.rowCentered]}>
                <StepNumber n={step.index + 1} />
                <Text style={[styles.scheduledTitle, styles.rowMain]} lineBreakStrategyIOS="hangul-word">
                  {month}에 {step.index + 1}번째 {unit}을 가입하세요
                </Text>
                <ReminderPill date={reminderDate} month={month} tint={tint} onPress={() => onReminder(step)} />
              </View>
            );
          }

          return (
            <View key={step.index} style={[styles.row, styles.rowLocked]}>
              <StepNumber n={step.index + 1} />
              <Text style={[styles.lockedTitle, styles.rowMain]}>
                {step.index + 1}번째 {unit} 가입
              </Text>
              <Text style={styles.lockedMonth}>{month}</Text>
            </View>
          );
        })}

        {hiddenCount > 0 && (
          <Pressable style={[styles.row, styles.rowCentered]} onPress={() => setShowAllPending(true)}>
            <Text style={[styles.moreText, { color: tint.solid }, styles.rowMain]} accessibilityLabel={`${hiddenCount}단계 더보기`}>
              더보기
            </Text>
            <Chevron direction="down" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** 할 일 강조색 (진한 색: 숫자·체크·켜진 알림, 옅은 색: 지금 할 단계 바탕·꺼진 알림) */
interface Tint {
  solid: ColorValue;
  soft: ColorValue;
}

const DONE_ICON: SymbolViewProps['name'] = { ios: 'checkmark.circle.fill', android: 'check_circle' };

/** 종 옆에 알림 날짜(없으면 '알림')를 붙여 무엇을 하는 버튼인지, 언제 오는지 보이게 한다 */
function ReminderPill({
  date,
  month,
  tint,
  onPress,
}: {
  date?: string;
  month: string;
  tint: Tint;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.bell, { backgroundColor: date ? tint.solid : tint.soft }]}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={date ? `${formatDateShort(date)}에 가입 알림, 바꾸기` : `${month} 가입 알림 받기`}
    >
      <SymbolView
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        name={date ? { ios: 'bell.fill', android: 'notifications_active' } : { ios: 'bell', android: 'notifications' }}
        size={15}
        tintColor={date ? '#FFFFFF' : tint.solid}
        fallback={<Text style={styles.bellFallback}>🔔</Text>}
      />
      <Text style={[styles.bellText, { color: date ? '#FFFFFF' : tint.solid }]}>{date ? formatDateShort(date) : '알림'}</Text>
    </Pressable>
  );
}

function StepIcon({ name, color }: { name: SymbolViewProps['name']; color: ColorValue }) {
  return (
    <SymbolView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      name={name}
      size={24}
      tintColor={color}
      style={styles.icon}
      fallback={<Text style={[styles.iconFallback, { color }]}>✓</Text>}
    />
  );
}

function StepNumber({ n, active = false, tint }: { n: number; active?: boolean; tint?: Tint }) {
  return (
    <View style={[styles.number, active && tint && { borderColor: tint.solid, backgroundColor: tint.solid }]}>
      <Text style={[styles.numberText, active && styles.numberTextActive]} maxFontSizeMultiplier={1.4}>
        {n}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  progress: {
    fontSize: 15,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowNowPressed: {
    opacity: 0.6,
  },
  moreText: {
    fontSize: 15,
    color: colors.primary,
    paddingLeft: 38,
  },
  rowMatured: {
    backgroundColor: 'rgba(255, 141, 40, 0.12)',
  },
  rowCentered: {
    alignItems: 'center',
  },
  bell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  bellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  bellFallback: {
    fontSize: 15,
  },
  rowLocked: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  icon: {
    width: 26,
    height: 26,
  },
  iconFallback: {
    fontSize: 20,
    width: 26,
    textAlign: 'center',
  },
  number: {
    // 큰 글자에서도 숫자가 원 밖으로 넘치지 않게 최소 크기만 정한다.
    minWidth: 26,
    minHeight: 26,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textFaint,
  },
  numberTextActive: {
    color: '#FFFFFF',
  },
  doneTitle: {
    fontSize: 17,
    color: colors.textMuted,
    lineHeight: 26,
  },
  nowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 26,
  },
  scheduledTitle: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 26,
  },
  lockedTitle: {
    fontSize: 15,
    color: colors.textFaint,
  },
  lockedMonth: {
    fontSize: 15,
    color: colors.textFaint,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
});
