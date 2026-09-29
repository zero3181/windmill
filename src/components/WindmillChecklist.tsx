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
  /** 다음 가입 달이 되면 알림을 받을지 */
  reminderOn: boolean;
  onToggleReminder: () => void;
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
  reminderOn,
  onToggleReminder,
}: Props) {
  const { steps, perAccount, termMonths, doneCount, complete } = checklist;
  const [showDone, setShowDone] = useState(false);
  const unit = UNIT[type];
  const amountLabel = `${type === 'savings' ? '월 ' : ''}${formatManwon(perAccount)}`;

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

      <View style={styles.card}>
        {collapseDone ? (
          <Pressable style={styles.row} onPress={() => setShowDone(true)}>
            <StepIcon name="checkmark.circle.fill" color={colors.success} />
            <View style={styles.rowMain}>
              <Text style={styles.doneTitle}>
                {done.length === 1 ? '1번째' : `1~${done.length}번째`} {unit} 가입 완료
              </Text>
            </View>
            <Chevron direction="down" />
          </Pressable>
        ) : (
          done.map((step) => (
            <Pressable key={step.index} style={styles.row} onPress={() => step.account && onOpenAccount(step.account.id)}>
              <StepIcon name="checkmark.circle.fill" color={colors.success} />
              <View style={styles.rowMain}>
                <Text style={styles.doneTitle}>
                  {step.index + 1}번째 {unit} 가입 완료
                </Text>
                <Text style={styles.subtitle}>
                  {formatMonth(step.month, today)} 가입{step.account?.bank ? ` · ${step.account.bank}` : ''}
                </Text>
              </View>
              <Chevron />
            </Pressable>
          ))
        )}

        {pending.map((step) => {
          const month = formatMonth(step.month, today);
          // 적금은 계좌가 늘수록 매달 넣는 돈도 늘어나니, 그 달부터의 총액을 한 줄 더 알려 준다.
          const outlay =
            type === 'savings' && step.index > 0
              ? `\n가입하면 매달 총 ${formatManwon(step.monthlyOutlay)}을 넣게 돼요`
              : '';

          if (step.status === 'now') {
            return (
              <View key={step.index} style={[styles.row, styles.rowNow]}>
                <StepNumber n={step.index + 1} active />
                <View style={styles.rowMain}>
                  <Text style={styles.nowTitle}>
                    {step.index + 1}번째 {unit}을 가입하세요
                  </Text>
                  <Text style={styles.subtitle}>
                    {termMonths}개월 {unit} · {amountLabel}
                    {outlay}
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
              <View key={step.index} style={styles.row}>
                <StepNumber n={step.index + 1} />
                <View style={styles.rowMain}>
                  <Text style={styles.scheduledTitle}>
                    {month}에 {step.index + 1}번째 {unit}을 가입하세요
                  </Text>
                  <Text style={styles.subtitle}>
                    {termMonths}개월 {unit} · {amountLabel}
                    {outlay}
                  </Text>
                  <Text style={styles.note}>이번 달에 또 가입하면 만기가 같은 달에 겹쳐요.</Text>
                  <Pressable
                    style={[styles.reminder, reminderOn && styles.reminderOn]}
                    onPress={onToggleReminder}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: reminderOn }}
                  >
                    <SymbolView
                      name={reminderOn ? 'bell.fill' : 'bell'}
                      size={15}
                      tintColor={reminderOn ? '#FFFFFF' : colors.primary}
                      fallback={null}
                    />
                    <Text style={[styles.reminderText, reminderOn && styles.reminderTextOn]}>
                      {reminderOn ? `${formatDateShort(step.month)}에 알려드릴게요` : `${formatDateShort(step.month)}에 알림 받기`}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View key={step.index} style={[styles.row, styles.rowLocked]}>
              <StepNumber n={step.index + 1} />
              <View style={styles.rowMain}>
                <Text style={styles.lockedTitle}>
                  {step.index + 1}번째 {unit} 가입
                </Text>
              </View>
              <Text style={styles.lockedMonth}>{month}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.footer}>
        {complete
          ? `이제 매달 만기가 돌아와요. 만기가 된 ${unit}은 그달에 다시 가입하면 풍차가 계속 돌아요.`
          : `매달 하나씩 가입하면 ${steps.length}개월 뒤 풍차가 완성돼요.`}
      </Text>
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
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  note: {
    fontSize: 13,
    color: colors.textFaint,
    marginTop: 2,
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
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  reminderOn: {
    backgroundColor: colors.primary,
  },
  reminderText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  reminderTextOn: {
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
});
