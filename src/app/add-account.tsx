import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AccountForm } from '../components/AccountForm';
import { Card, GroupedSection, ListRow } from '../components/ui/Grouped';
import { formatManwon } from '../lib/format';
import { bladePosition, fitsWindmill } from '../lib/blades';
import { computeMaturityDate } from '../lib/calc';
import { notifyCelebrate, notifySaved } from '../lib/feedback';
import { askNotificationPermission } from '../lib/notifications';
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
  // 금리도 같은 종류로 마지막에 가입한 계좌를 기본값으로 쓴다 (금리를 비워 둔 계좌는 건너뛴다).
  const defaultRates = useMemo(() => {
    const latest = (type: 'savings' | 'deposit') =>
      accounts
        .filter((a) => a.type === type && a.rate > 0)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.rate;
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

  // 가입 페이지 위에 금리 비교를 띄운다. 상품을 고르면 폼에 은행·상품명·금리가 채워진다.
  function openRates() {
    const formType = prefill?.type ?? 'savings';
    const term = prefill?.termMonths ?? settings.goals[formType]?.blades ?? 12;
    router.push({ pathname: '/pick-product', params: { term: String(term), type: formType } });
  }

  async function handleSubmit(input: NewAccountInput) {
    const isFirstAccount = accounts.length === 0;
    const goal = settings.goals[input.type];
    const maturity = input.maturityDate || computeMaturityDate(input.startDate, input.termMonths);
    // 이 계좌가 마지막 빈 날개를 채우면 풍차가 처음 돌기 시작하는 순간이다.
    let completes = false;
    if (goal && fitsWindmill(input, goal.blades)) {
      const filled = new Set(
        accounts
          .filter((a) => a.status === 'active' && a.type === input.type && fitsWindmill(a, goal.blades))
          .map((a) => bladePosition(a.maturityDate, goal.blades))
      );
      completes = filled.size === goal.blades - 1 && !filled.has(bladePosition(maturity, goal.blades));
    }
    await addAccount(input);
    // 풍차에 들어가는 계좌면 채워진 달 날개를, 아니면 등록했다는 것만 알린다.
    if (completes) notifyCelebrate('풍차 완성! 이제 매달 만기가 돌아와요');
    else
      notifySaved(goal && fitsWindmill(input, goal.blades) ? `${Number(maturity.slice(5, 7))}월 날개를 채웠어요` : '계좌를 등록했어요');
    router.back();
    // 첫 계좌를 등록하면, 만기 알림에 쓸 권한을 이유와 함께 묻는다.
    if (isFirstAccount) {
      await askNotificationPermission('만기 7일 전과 다음 가입 날에 알려드릴게요.').catch(() => undefined);
    }
  }

  return (
    <>
      {step > 0 && <Stack.Screen options={{ title: `${step}번째 ${unit} 가입` }} />}
      <AccountForm
        initial={prefill}
        knownBanks={knownBanks}
        defaultTaxType={settings.defaultTaxType}
        windmillTerms={{ savings: settings.goals.savings?.blades, deposit: settings.goals.deposit?.blades }}
        submitLabel="저장"
        defaultAmounts={defaultAmounts}
        defaultRates={defaultRates}
        lockedType={step > 0}
        banner={params.from === 'rates' ? '금리 비교에서 고른 상품 정보가 채워졌어요' : undefined}
        header={
          <>
            {step > 0 && prefill ? (
              <Card style={styles.guide}>
                <Text style={styles.guideTitle}>이 조건으로 가입하세요</Text>
                <Text style={styles.guideBody}>
                  {prefill.termMonths}개월 {unit} · {unit === '적금' ? '월 ' : ''}
                  {formatManwon(prefill.amount ?? 0)}
                </Text>
              </Card>
            ) : null}
            <GroupedSection>
              <ListRow title="금리 높은 상품 보기" tint="primary" chevron onPress={openRates} />
            </GroupedSection>
          </>
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
});
