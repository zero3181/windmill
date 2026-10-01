import { SymbolView, type SFSymbol } from 'expo-symbols';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Checklist, ChecklistStep } from '../lib/checklist';
import { formatDateShort, formatManwon, formatMonth } from '../lib/format';
import { colors, radius, spacing } from '../theme';
import type { AccountType } from '../types/account';
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
}

const UNIT: Record<AccountType, string> = { savings: '적금', deposit: '예금' };

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
}: Props) {
  const { steps, perAccount, termMonths, doneCount, complete } = checklist;
  const [showDone, setShowDone] = useState(false);
  const unit = UNIT[type];

  const done = steps.filter((s) => s.status === 'done');
  const pending = steps.filter((s) => s.status !== 'done');
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
        {collapseDone ? (
          <Pressable style={styles.row} onPress={() => setShowDone(true)}>
            <StepIcon name="checkmark.circle.fill" color={colors.success} />
            <Text style={[styles.doneTitle, styles.rowMain]}>
              1~{done.length}번째 {unit} 가입 완료
            </Text>
            <Chevron direction="down" />
          </Pressable>
        ) : (
          done.map((step) => (
            <Pressable key={step.index} style={styles.row} onPress={() => step.account && onOpenAccount(step.account.id)}>
              <StepIcon name="checkmark.circle.fill" color={colors.success} />
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
                    <Pressable style={styles.joinButton} onPress={() => onJoin(step)}>
                      <Text style={styles.joinText}>가입했어요</Text>
                    </Pressable>
                    <Pressable style={styles.linkButton} onPress={() => onFindProducts(step)} hitSlop={6}>
                      <Text style={styles.linkText}>금리 높은 상품 보기</Text>
                    </Pressable>
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
                    name={reminderDate ? 'bell.fill' : 'bell'}
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
      </View>
    </View>
  );
}

function StepIcon({ name, color }: { name: SFSymbol; color: string }) {
  return (
    <SymbolView
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
      <Text style={[styles.numberText, active && styles.numberTextActive]}>{n}</Text>
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
    height: 32,
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
    width: 26,
    height: 26,
    borderRadius: 13,
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
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  joinText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkButton: {
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: 15,
    color: colors.primary,
  },
});
