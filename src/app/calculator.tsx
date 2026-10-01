import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Segmented } from '../components/ui/Controls';
import { InputRow, PickerRow } from '../components/ui/FormRows';
import { Card, GroupedSection, ListRow } from '../components/ui/Grouped';
import { todayKST } from '../lib/calc';
import { formatManwon, formatWon } from '../lib/format';
import { divisors, planWindmill } from '../lib/windmillPlan';
import { useAccounts } from '../store/AccountsContext';
import { useWindmillType } from '../store/WindmillTypeContext';
import { colors, spacing } from '../theme';
import { TAX_TYPE_LABELS, type AccountType } from '../types/account';
import { FormScrollView } from '../components/ui/FormScrollView';

const TERM_OPTIONS = [6, 12];

const LABELS: Record<AccountType, { total: string; per: string; unit: string }> = {
  savings: { total: '월 납입 총액', per: '계좌당 월 납입액', unit: '적금' },
  deposit: { total: '총 예치금', per: '계좌당 예치금', unit: '예금' },
};

type OpenPicker = 'term' | 'interval' | 'count' | null;

function parseAmount(text: string): number {
  return Number(text.replace(/[^0-9]/g, '')) || 0;
}

function formatInput(n: number): string {
  return n > 0 ? n.toLocaleString('ko-KR') : '';
}

function formatMonth(iso: string): string {
  const [y, m] = iso.split('-');
  return `${y}년 ${Number(m)}월`;
}

function intervalLabel(months: number): string {
  return months === 1 ? '매달' : `${months}개월마다`;
}

export default function PlanScreen() {
  const { settings } = useAccounts();
  // 홈과 공유하는 값을 바꾸면 홈이 다시 되돌려 버려서, 이 화면 안에서만 쓰는 값으로 둔다.
  const { type: homeType } = useWindmillType();
  const [type, setType] = useState<AccountType>(homeType);
  const [termMonths, setTermMonths] = useState(12);
  const [intervalMonths, setIntervalMonths] = useState(1);
  const [amount, setAmount] = useState(1_200_000);
  /** 사용자가 마지막으로 직접 입력한 금액이 총액인지 계좌당 금액인지 */
  const [amountBasis, setAmountBasis] = useState<'total' | 'per'>('total');
  const [rateText, setRateText] = useState('3.5');
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const today = todayKST();
  const options = divisors(termMonths);
  const count = termMonths / intervalMonths;
  const perAccount = amountBasis === 'per' ? amount : Math.floor(amount / count);
  const rate = Number(rateText) || 0;
  const labels = LABELS[type];

  const plan = useMemo(
    () =>
      planWindmill(
        { type, termMonths, intervalMonths, perAccount, rate, taxType: settings.defaultTaxType },
        today
      ),
    [type, termMonths, intervalMonths, perAccount, rate, settings.defaultTaxType, today]
  );

  const remainder = amountBasis === 'total' ? amount - plan.total : 0;

  function handleTermChange(next: number) {
    setTermMonths(next);
    // 기존 만기 주기가 새 기간의 약수가 아니면 가장 가까운 약수로 맞춘다.
    const nextOptions = divisors(next);
    if (!nextOptions.includes(intervalMonths)) {
      setIntervalMonths(
        nextOptions.reduce((best, d) => (Math.abs(d - intervalMonths) < Math.abs(best - intervalMonths) ? d : best))
      );
    }
  }

  const toggle = (picker: Exclude<OpenPicker, null>) => () => setOpenPicker((cur) => (cur === picker ? null : picker));

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Segmented
        options={[
          { value: 'savings', label: '적금 풍차' },
          { value: 'deposit', label: '예금 풍차' },
        ]}
        value={type}
        onChange={setType}
      />

      <GroupedSection title="조건">
        <PickerRow
          title="가입 기간"
          options={TERM_OPTIONS.map((t) => ({ value: t, label: `${t}개월` }))}
          value={termMonths}
          onChange={handleTermChange}
          open={openPicker === 'term'}
          onToggle={toggle('term')}
        />
        <PickerRow
          title="만기 주기"
          options={options.map((d) => ({ value: d, label: intervalLabel(d) }))}
          value={intervalMonths}
          onChange={setIntervalMonths}
          open={openPicker === 'interval'}
          onToggle={toggle('interval')}
        />
        <PickerRow
          title="계좌 개수"
          options={[...options].reverse().map((n) => ({ value: n, label: `${n}개` }))}
          value={count}
          onChange={(n) => setIntervalMonths(termMonths / n)}
          open={openPicker === 'count'}
          onToggle={toggle('count')}
        />
      </GroupedSection>

      <GroupedSection
        title="금액"
        footer={
          remainder > 0
            ? `${count}개로 나누어 떨어지지 않아 계좌당 ${formatWon(perAccount)}으로 계산했어요 (남는 금액 ${formatWon(remainder)})`
            : '총액이나 계좌당 금액 중 하나를 입력하면 나머지가 계산돼요.'
        }
      >
        <InputRow
          title={labels.total}
          value={formatInput(amountBasis === 'total' ? amount : plan.total)}
          onChangeText={(t) => {
            setAmount(parseAmount(t));
            setAmountBasis('total');
          }}
          keyboardType="number-pad"
          placeholder="0"
          suffix="원"
          highlighted={amountBasis === 'total'}
        />
        <InputRow
          title={labels.per}
          value={formatInput(perAccount)}
          onChangeText={(t) => {
            setAmount(parseAmount(t));
            setAmountBasis('per');
          }}
          keyboardType="number-pad"
          placeholder="0"
          suffix="원"
          highlighted={amountBasis === 'per'}
        />
        <InputRow
          title="예상 금리"
          value={rateText}
          onChangeText={setRateText}
          keyboardType="decimal-pad"
          placeholder="3.5"
          suffix="%"
        />
      </GroupedSection>

      {perAccount > 0 && (
        <>
          <Card style={styles.result}>
            <Text style={styles.headline}>
              {formatManwon(perAccount)}짜리 {termMonths}개월 {labels.unit}을{'\n'}
              {intervalLabel(intervalMonths)} 하나씩, 총 {count}개 가입
            </Text>
            <Text style={styles.body}>
              {type === 'savings'
                ? `납입액은 첫 달 ${formatManwon(perAccount)}에서 ${intervalLabel(intervalMonths)} 늘어나 ${plan.fullFromMonth}개월째부터 매달 ${formatManwon(plan.total)}이 돼요.`
                : `${intervalLabel(intervalMonths)} ${formatManwon(perAccount)}씩 예치해 총 ${formatManwon(plan.total)}이 필요해요.`}
            </Text>
            <View style={styles.divider} />
            <KV label="첫 만기" value={formatMonth(plan.maturities[0])} />
            <KV label="계좌 하나 만기 수령액 (세후)" value={formatWon(plan.payoutPerAccount)} strong />
            <KV label={`${count}개 세후 이자 합계`} value={formatWon(plan.totalAfterTaxInterest)} />
          </Card>


          <GroupedSection
            title="가입 일정"
            footer={`단리, ${TAX_TYPE_LABELS[settings.defaultTaxType]} 기준 예상치예요. 실제 이자는 상품 조건에 따라 달라요.`}
          >
            {plan.openings.map((d, i) => (
              <ListRow key={d} title={`${i + 1}번째 · ${formatMonth(d)} 가입`} detail={`${formatMonth(plan.maturities[i])} 만기`} />
            ))}
          </GroupedSection>
        </>
      )}
    </FormScrollView>
  );
}

function KV({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, strong && styles.kvStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  result: {
    gap: spacing.sm,
  },
  headline: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kvLabel: {
    fontSize: 15,
    color: colors.textMuted,
  },
  kvValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  kvStrong: {
    fontSize: 17,
    color: colors.primary,
  },
});
