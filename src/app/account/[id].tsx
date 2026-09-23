import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calcAccountFinancials, todayKST } from '../../lib/calc';
import { formatDateFull, formatPercent, formatWon } from '../../lib/format';
import { TAX_TYPE_LABELS } from '../../types/account';
import { useAccounts } from '../../store/AccountsContext';
import { colors, radius, spacing } from '../../theme';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accounts, removeAccount, closeAccount } = useAccounts();
  const [busy, setBusy] = useState(false);

  const account = useMemo(() => accounts.find((a) => a.id === id), [accounts, id]);
  const financials = useMemo(
    () => (account ? calcAccountFinancials(account, todayKST()) : null),
    [account]
  );

  if (!account || !financials) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>계좌를 찾을 수 없어요</Text>
      </View>
    );
  }

  const isMatured = financials.daysToMaturity <= 0;

  function handleDelete() {
    Alert.alert('계좌 삭제', `'${account!.name}' 계좌를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await removeAccount(account!.id);
          router.back();
        },
      },
    ]);
  }

  function handleMatureClose() {
    Alert.alert('만기 처리', '해지 처리할까요? 계좌가 보관함으로 이동해요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '해지 처리',
        onPress: async () => {
          setBusy(true);
          await closeAccount(account!.id);
          setBusy(false);
        },
      },
    ]);
  }

  function handleRenew() {
    const prefill = {
      name: account!.name,
      bank: account!.bank,
      type: account!.type,
      amount: account!.amount,
      rate: account!.rate,
      taxType: account!.taxType,
      termMonths: account!.termMonths,
      payDay: account!.payDay,
    };
    router.push({ pathname: '/account/new', params: { prefill: JSON.stringify(prefill) } });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.name}>{account.name}</Text>
        <Text style={styles.bank}>
          {account.bank} · {account.type === 'deposit' ? '예금' : '적금'} · {formatPercent(account.rate)}
        </Text>
        <View style={styles.statusRow}>
          <StatusBadge status={account.status} isMatured={isMatured} />
        </View>
      </View>

      <Section title="만기 정보">
        <Row label="가입일" value={formatDateFull(account.startDate)} />
        <Row label="가입 기간" value={`${account.termMonths}개월`} />
        <Row label="만기일" value={formatDateFull(financials.maturityDate)} />
        {account.type === 'savings' && <Row label="월 납입일" value={`매월 ${account.payDay}일`} />}
      </Section>

      <Section title="금액">
        <Row label={account.type === 'deposit' ? '예치 원금' : '월 납입액'} value={formatWon(account.amount)} />
        <Row label="현재까지 원금" value={formatWon(financials.currentPrincipal)} />
        <Row label="과세 구분" value={TAX_TYPE_LABELS[account.taxType]} />
        <Row label="세전 이자 (예상)" value={formatWon(financials.grossInterest)} />
        <Row label="세금 (예상)" value={`-${formatWon(financials.taxAmount)}`} />
        <Row label="세후 이자 (예상)" value={formatWon(financials.afterTaxInterest)} highlight />
        <Row label="만기 수령액 (예상)" value={formatWon(financials.maturityPayout)} highlight />
      </Section>

      {account.memo ? (
        <Section title="메모">
          <Text style={styles.memo}>{account.memo}</Text>
        </Section>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/account/${account.id}/edit`)}
          disabled={busy}
        >
          <Text style={styles.editButtonText}>수정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={busy}
        >
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>

      {account.status === 'active' && (
        <View style={styles.matureSection}>
          <TouchableOpacity style={styles.matureButton} onPress={handleMatureClose} disabled={busy}>
            <Text style={styles.matureButtonText}>만기 처리 · 해지</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.renewButton} onPress={handleRenew} disabled={busy}>
            <Text style={styles.renewButtonText}>만기 처리 · 같은 조건으로 재가입</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function StatusBadge({ status, isMatured }: { status: string; isMatured: boolean }) {
  const label = status === 'closed' ? '해지됨' : status === 'active' && isMatured ? '만기 도래' : '진행 중';
  const style = status === 'closed' ? styles.badgeClosed : isMatured ? styles.badgeMatured : styles.badgeActive;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    color: colors.textMuted,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  bank: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeActive: {
    backgroundColor: colors.primarySoft,
  },
  badgeMatured: {
    backgroundColor: '#FFF3DC',
  },
  badgeClosed: {
    backgroundColor: colors.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowValueHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  memo: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primarySoft,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: colors.dangerSoft,
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: '700',
  },
  matureSection: {
    gap: spacing.sm,
  },
  matureButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matureButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  renewButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  renewButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
