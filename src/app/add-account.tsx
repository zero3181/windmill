import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AccountForm } from '../components/AccountForm';
import { Card } from '../components/ui/Grouped';
import { formatWon } from '../lib/format';
import { ensureNotificationSetup } from '../lib/notifications';
import { useAccounts } from '../store/AccountsContext';
import { colors, spacing } from '../theme';
import type { Account, NewAccountInput } from '../types/account';

export default function NewAccountScreen() {
  const router = useRouter();
  const { accounts, addAccount, settings } = useAccounts();
  /** step: 풍차 체크리스트에서 들어온 단계 번호 (1부터) */
  const params = useLocalSearchParams<{ prefill?: string; from?: string; step?: string }>();

  const knownBanks = useMemo(() => Array.from(new Set(accounts.map((a) => a.bank).filter(Boolean))), [accounts]);
  // 가장 최근에 등록한 같은 종류 계좌의 금액을 기본값으로 쓴다.
  const defaultAmounts = useMemo(() => {
    const latest = (type: 'savings' | 'deposit') =>
      accounts
        .filter((a) => a.type === type && a.status === 'active')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.amount;
    return { savings: latest('savings'), deposit: latest('deposit') };
  }, [accounts]);

  const prefill = useMemo((): Partial<Account> | undefined => {
    if (!params.prefill) return undefined;
    try {
      return JSON.parse(params.prefill);
    } catch {
      return undefined;
    }
  }, [params.prefill]);

  const step = Number(params.step) || 0;
  const unit = prefill?.type === 'deposit' ? '예금' : '적금';

  async function handleSubmit(input: NewAccountInput) {
    // 만기·납입일 알림에 쓸 권한은 계좌를 처음 등록하는 이 순간에 묻는다.
    await ensureNotificationSetup(true).catch(() => false);
    await addAccount(input);
    router.back();
  }

  return (
    <>
      {step > 0 && <Stack.Screen options={{ title: `${step}번째 ${unit} 가입` }} />}
      <AccountForm
        initial={prefill}
        knownBanks={knownBanks}
        defaultTaxType={settings.defaultTaxType}
        submitLabel={step > 0 ? '가입 완료' : '저장'}
        defaultAmounts={defaultAmounts}
        lockedType={step > 0}
        banner={params.from === 'rates' ? '금리 비교에서 고른 상품 정보가 채워졌어요' : undefined}
        header={
          step > 0 && prefill ? (
            <Card style={styles.guide}>
              <Text style={styles.guideTitle}>은행 앱에서 이 조건으로 가입하세요</Text>
              <Text style={styles.guideBody}>
                {prefill.termMonths}개월 {unit} · {unit === '적금' ? '월 ' : ''}
                {formatWon(prefill.amount ?? 0)}
              </Text>
              <Text style={styles.guideHint}>가입했으면 아래 내용을 확인하고 오른쪽 위 ‘가입 완료’를 눌러 주세요.</Text>
            </Card>
          ) : null
        }
        onSubmit={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  guide: {
    gap: spacing.xs,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  guideBody: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  guideHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
