import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, GroupedSection, ListRow } from '../../components/ui/Grouped';
import { HeaderActions } from '../../components/ui/HeaderActions';
import {
  calcAccountFinancials,
  countElapsedInstallments,
  diffInDays,
  parseISODate,
  todayKST,
} from '../../lib/calc';
import { notifyUndoable } from '../../lib/feedback';
import { formatDateFull, formatDday, formatPercent, formatWon } from '../../lib/format';
import { useAccounts } from '../../store/AccountsContext';
import { colors, radius, spacing } from '../../theme';
import { TAX_TYPE_LABELS } from '../../types/account';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accounts, removeAccount, closeAccount, reopenAccount, restoreAccount } = useAccounts();
  const [busy, setBusy] = useState(false);
  const today = todayKST();

  const account = useMemo(() => accounts.find((a) => a.id === id), [accounts, id]);
  const financials = useMemo(() => (account ? calcAccountFinancials(account, today) : null), [account, today]);

  if (!account || !financials) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>계좌를 찾을 수 없어요</Text>
      </View>
    );
  }

  const isSavings = account.type === 'savings';
  const isActive = account.status === 'active';
  const paidCount = isSavings
    ? countElapsedInstallments(account.startDate, account.payDay ?? parseISODate(account.startDate).d, account.termMonths, today)
    : 0;
  const totalDays = Math.max(1, diffInDays(financials.maturityDate, account.startDate));
  const progress = isSavings
    ? paidCount / account.termMonths
    : Math.min(1, Math.max(0, diffInDays(today, account.startDate) / totalDays));
  const soon = financials.daysToMaturity <= 30;

  function confirm(title: string, message: string, action: string, onConfirm: () => Promise<void>, destructive = false) {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      {
        text: action,
        style: destructive ? 'destructive' : 'default',
        onPress: async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  function handleEarlyClose() {
    confirm('중도 해지', '만기 전에 해지했나요? 종료된 계좌로 옮겨져요.', '중도 해지', async () => {
      const id = account!.id;
      await closeAccount(id, 'closed');
      router.back();
      notifyUndoable('중도 해지했어요', () => reopenAccount(id));
    });
  }

  function handleMaturedClose() {
    confirm('만기 해지', '만기가 되어 해지했나요? 종료된 계좌로 옮겨져요.', '만기 해지', async () => {
      const id = account!.id;
      await closeAccount(id, 'matured');
      router.back();
      notifyUndoable('만기 해지했어요', () => reopenAccount(id));
    });
  }

  function handleDelete() {
    confirm(
      '계좌 삭제',
      `'${account!.name}' 계좌를 삭제할까요?`,
      '삭제',
      async () => {
        // 삭제 직후 잠깐 '되돌리기'를 보여 주려고 지우기 전 내용을 들고 있는다.
        const snapshot = account!;
        await removeAccount(snapshot.id);
        router.back();
        notifyUndoable('계좌를 삭제했어요', () => restoreAccount(snapshot));
      },
      true
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: account.name }} />
      <HeaderActions right={{ label: '편집', onPress: () => router.push(`/edit-account/${account.id}`) }} />

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Card style={styles.hero}>
          <Text style={styles.heroSub}>
            {[account.bank, isSavings ? '적금' : '예금', account.rate > 0 ? formatPercent(account.rate) : '금리 미입력'].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.heroAmount}>{formatWon(financials.maturityPayout)}</Text>
          <Text style={styles.heroCaption}>만기 예상 수령액 (세후)</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, !isActive ? styles.badgeEnded : soon ? styles.badgeSoon : styles.badgeNormal]}>
              <Text style={[styles.badgeText, !isActive ? styles.badgeTextEnded : soon ? styles.badgeTextSoon : null]}>
                {account.status === 'closed' ? '중도 해지' : account.status === 'matured' ? '만기 해지' : formatDday(financials.daysToMaturity)}
              </Text>
            </View>
            <Text style={styles.heroDate}>{formatDateFull(financials.maturityDate)} 만기</Text>
          </View>
          {isActive && (
            <View style={styles.progress}>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  {isSavings ? `${paidCount} / ${account.termMonths}회 납입` : `${account.termMonths}개월 중 진행`}
                </Text>
                <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>
          )}
        </Card>

        <GroupedSection title="만기 정보">
          <ListRow title="가입일" detail={formatDateFull(account.startDate)} />
          <ListRow title="가입 기간" detail={`${account.termMonths}개월`} />
          {isSavings && <ListRow title="월 납입일" detail={`매월 ${account.payDay}일`} />}
        </GroupedSection>

        <GroupedSection title="금액">
          <ListRow title={isSavings ? '월 납입액' : '예치금'} detail={formatWon(account.amount)} />
          <ListRow title="현재까지 원금" detail={formatWon(financials.currentPrincipal)} />
          <ListRow title="예상 이자 (세후)" detail={formatWon(financials.afterTaxInterest)} />
          <ListRow title="과세 구분" detail={TAX_TYPE_LABELS[account.taxType]} />
        </GroupedSection>

        {account.memo ? (
          <GroupedSection title="메모">
            <ListRow title={account.memo} />
          </GroupedSection>
        ) : null}

        {isActive && (
          <GroupedSection title="해지">
            <ListRow title="중도 해지" tint="primary" onPress={busy ? undefined : handleEarlyClose} />
            {/* 만기 해지는 만기일이 된 뒤에만 누를 수 있다 */}
            <ListRow
              title="만기 해지"
              tint="primary"
              disabled={financials.daysToMaturity > 0}
              onPress={busy ? undefined : handleMaturedClose}
            />
          </GroupedSection>
        )}

        {/* 잘못 해지했다면 종료된 계좌에서 다시 진행 중으로 되돌릴 수 있다 */}
        {!isActive && (
          <GroupedSection>
            <ListRow title="진행 중으로 되돌리기" tint="primary" onPress={busy ? undefined : () => reopenAccount(account.id)} />
          </GroupedSection>
        )}

        <GroupedSection>
          <ListRow title="계좌 삭제" tint="destructive" onPress={busy ? undefined : handleDelete} />
        </GroupedSection>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    color: colors.textMuted,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  hero: {
    gap: 4,
  },
  heroSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  heroCaption: {
    fontSize: 13,
    color: colors.textFaint,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeNormal: {
    backgroundColor: colors.primarySoft,
  },
  badgeSoon: {
    backgroundColor: colors.dangerSoft,
  },
  badgeEnded: {
    backgroundColor: colors.barEmpty,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  badgeTextSoon: {
    color: colors.danger,
  },
  badgeTextEnded: {
    color: colors.textMuted,
  },
  heroDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  progress: {
    marginTop: spacing.md,
    gap: 6,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.barEmpty,
    overflow: 'hidden',
  },
  trackFill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
