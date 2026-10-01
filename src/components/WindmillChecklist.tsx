import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import type { Checklist, ChecklistStep } from '../lib/checklist';
import { formatDateShort, formatManwon, formatMonth } from '../lib/format';
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
  /** 이 단계에 맞는 금리 높은 상품 보기 */
  onFindProducts: (step: ChecklistStep) => void;
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
  onFindProducts,
  onOpenAccount,
  reminderDate,
  onReminder,
  matured,
  onRenew,
  onCloseMatured,
}: Props) {
  const { steps, perAccount, termMonths, doneCount, complete } = checklist;
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
      {/* 모든 단계에 같은 조건이라 한 번만 보여 준다. */}
      <Text style={styles.summary}>
        {termMonths}개월 {unit} · {type === 'savings' ? '월 ' : ''}
        {formatManwon(perAccount)}
      </Text>

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
            <StepIcon name={DONE_ICON} color={colors.success} />
            <Text style={[styles.doneTitle, styles.rowMain]}>
              1~{done.length}번째 {unit} 가입 완료
            </Text>
            <Chevron direction="down" />
          </Pressable>
        ) : (
          done.map((step) => (
            <Pressable key={step.index} style={styles.row} onPress={() => step.account && onOpenAccount(step.account.id)}>
              <StepIcon name={DONE_ICON} color={colors.success} />
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
              <View key={step.index} style={[styles.row, styles.rowNow]}>
                <StepNumber n={step.index + 1} active />
                <View style={styles.rowMain}>
                  <Text style={styles.nowTitle} lineBreakStrategyIOS="hangul-word">
                    {step.index + 1}번째 {unit}을 가입하세요
                  </Text>
                  <View style={styles.actions}>
                    <PillButton label="가입했어요" onPress={() => onJoin(step)} />
                    <LinkButton label="금리 높은 상품 보기" onPress={() => onFindProducts(step)} />
                  </View>
                </View>
              </View>
            );
          }

          if (step.status === 'scheduled') {
            return (
              <View key={step.index} style={[styles.row, styles.rowCentered]}>
                <StepNumber n={step.index + 1} />
                <Text style={[styles.scheduledTitle, styles.rowMain]} lineBreakStrategyIOS="hangul-word">
                  {month}에 {step.index + 1}번째 {unit}을 가입하세요
                </Text>
                {/* 종 옆에 알림 날짜(없으면 '알림')를 붙여 무엇을 하는 버튼인지, 언제 오는지 보이게 한다 */}
                <Pressable
                  style={[styles.bell, reminderDate && styles.bellOn]}
                  onPress={() => onReminder(step)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={reminderDate ? `${formatDateShort(reminderDate)}에 가입 알림, 바꾸기` : `${month} 가입 알림 받기`}
                >
                  <SymbolView
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    name={
                      reminderDate
                        ? { ios: 'bell.fill', android: 'notifications_active' }
                        : { ios: 'bell', android: 'notifications' }
                    }
                    size={15}
                    tintColor={reminderDate ? '#FFFFFF' : colors.primary}
                    fallback={<Text style={styles.bellFallback}>🔔</Text>}
                  />
                  <Text style={[styles.bellText, reminderDate && styles.bellTextOn]}>
                    {reminderDate ? formatDateShort(reminderDate) : '알림'}
                  </Text>
                </Pressable>
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
            <Text style={[styles.moreText, styles.rowMain]}>그 뒤 {hiddenCount}단계 더보기</Text>
            <Chevron direction="down" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const DONE_ICON: SymbolViewProps['name'] = { ios: 'checkmark.circle.fill', android: 'check_circle' };

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

function StepNumber({ n, active = false }: { n: number; active?: boolean }) {
  return (
    <View style={[styles.number, active && styles.numberActive]}>
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
  rowNow: {
    backgroundColor: colors.primarySoft,
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
  summary: {
    fontSize: 15,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: 2,
  },
  bell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  bellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  bellTextOn: {
    color: '#FFFFFF',
  },
  bellOn: {
    backgroundColor: colors.primary,
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
  numberActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
