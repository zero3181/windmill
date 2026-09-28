import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { computeMaturityDate, parseISODate, todayKST } from '../lib/calc';
import { colors, radius, spacing } from '../theme';
import { TAX_TYPE_LABELS, type Account, type AccountType, type NewAccountInput, type TaxType } from '../types/account';
import { Segmented } from './ui/Controls';
import { DateRow, InputRow } from './ui/FormRows';
import { Chevron, GroupedSection, ListRow } from './ui/Grouped';
import { FormScrollView } from './ui/FormScrollView';

interface Props {
  initial?: Partial<Account>;
  knownBanks: string[];
  defaultTaxType: TaxType;
  submitLabel: string;
  /** 폼 위에 띄울 안내 (예: 금리 비교에서 고른 상품 정보가 채워졌다는 안내) */
  banner?: string;
  /** 종류별 기본 금액: 이미 가입한 같은 종류 계좌의 금액 (매번 입력하지 않도록) */
  defaultAmounts?: Partial<Record<AccountType, number>>;
  /** 풍차 체크리스트에서 들어오면 종류가 정해져 있어 고르지 않는다. */
  lockedType?: boolean;
  /** 폼 맨 위에 둘 안내 (체크리스트 단계의 가입 조건 등) */
  header?: React.ReactNode;
  /** 이율·과세·납입일 등 세부 항목을 처음부터 펼칠지 (기존 계좌 편집) */
  detailsOpen?: boolean;
  onSubmit: (input: NewAccountInput) => Promise<void>;
}

const TAX_SHORT: Record<TaxType, string> = { general: '일반과세', preferential: '세금우대', exempt: '비과세' };

/** 별칭을 비워 두면 '9월 적금'처럼 가입 달로 이름을 붙인다. */
function defaultName(type: AccountType, startDate: string): string {
  return `${parseISODate(startDate).m}월 ${type === 'savings' ? '적금' : '예금'}`;
}

export function AccountForm({
  initial,
  knownBanks,
  defaultTaxType,
  submitLabel,
  banner,
  defaultAmounts = {},
  lockedType = false,
  header,
  detailsOpen = false,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [bank, setBank] = useState(initial?.bank ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'savings');
  const formatAmount = (n?: number) => (n ? n.toLocaleString('ko-KR') : '');
  const [amountText, setAmountText] = useState(formatAmount(initial?.amount ?? defaultAmounts[initial?.type ?? 'savings']));
  /** 금액을 직접 입력했거나 기존 값이 있으면 종류를 바꿔도 기본 금액으로 덮어쓰지 않는다 */
  const [amountTouched, setAmountTouched] = useState(Boolean(initial?.amount));
  const [rateText, setRateText] = useState(initial?.rate ? String(initial.rate) : '');
  const [taxType, setTaxType] = useState<TaxType>(initial?.taxType ?? defaultTaxType);
  const [startDate, setStartDate] = useState<string>(initial?.startDate ?? todayKST());
  const [termMonths, setTermMonths] = useState(initial?.termMonths ?? 12);
  const [payDayText, setPayDayText] = useState(
    initial?.payDay ? String(initial.payDay) : String(parseISODate(initial?.startDate ?? todayKST()).d)
  );
  const [memo, setMemo] = useState(initial?.memo ?? '');
  // 기존 만기일이 가입일+기간으로 계산한 값과 다를 때만 직접 정한 만기일로 본다.
  const [maturityOverride, setMaturityOverride] = useState<string | null>(
    initial?.maturityDate && initial.startDate && initial.termMonths
      ? initial.maturityDate === computeMaturityDate(initial.startDate, initial.termMonths)
        ? null
        : initial.maturityDate
      : null
  );
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const [showDetails, setShowDetails] = useState(detailsOpen);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termOptions = Array.from(new Set([6, 12, initial?.termMonths ?? 12])).sort((a, b) => a - b);
  const computedMaturity = useMemo(
    () => (startDate && termMonths > 0 ? computeMaturityDate(startDate, termMonths) : ''),
    [startDate, termMonths]
  );
  const maturityDate = maturityOverride ?? computedMaturity;

  const bankSuggestions = useMemo(() => {
    if (!bank) return [];
    return knownBanks.filter((b) => b.includes(bank) && b !== bank).slice(0, 5);
  }, [bank, knownBanks]);

  function handleStartDateChange(iso: string) {
    setStartDate(iso);
    // 가입일을 바꾸면 만기일도 가입 기간에 맞춰 다시 계산한다.
    setMaturityOverride(null);
    if (!initial?.payDay) setPayDayText(String(parseISODate(iso).d));
  }

  function handleTermChange(months: number) {
    setTermMonths(months);
    setMaturityOverride(null);
  }

  function handleTypeChange(next: AccountType) {
    setType(next);
    if (!amountTouched) setAmountText(formatAmount(defaultAmounts[next]));
  }

  function validate(): string | null {
    const amount = Number(amountText.replace(/,/g, ''));
    if (!amount || amount <= 0) return '금액을 입력해 주세요';
    const rate = Number(rateText || 0);
    if (isNaN(rate) || rate < 0) return '금리를 숫자로 입력해 주세요';
    if (!termMonths || termMonths <= 0) return '가입 기간을 골라 주세요';
    if (type === 'savings') {
      const payDay = Number(payDayText);
      if (!payDay || payDay < 1 || payDay > 31) return '납입일은 1~31일 중에서 입력해 주세요';
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const input: NewAccountInput = {
        name: name.trim() || defaultName(type, startDate),
        bank: bank.trim(),
        type,
        amount: Number(amountText.replace(/,/g, '')),
        rate: Number(rateText || 0),
        taxType,
        startDate,
        termMonths,
        maturityDate: maturityOverride ?? undefined,
        payDay: type === 'savings' ? Number(payDayText) : undefined,
        memo: memo.trim() || undefined,
      };
      await onSubmit(input);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>취소</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button variant="done" disabled={submitting} onPress={handleSubmit}>
          {submitLabel}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <FormScrollView contentContainerStyle={styles.content}>
        {banner && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        )}
        {error && (
          <View style={[styles.banner, styles.errorBanner]}>
            <Text style={[styles.bannerText, styles.errorText]}>{error}</Text>
          </View>
        )}

        {header}

        {!lockedType && (
          <Segmented
            options={[
              { value: 'savings', label: '적금' },
              { value: 'deposit', label: '예금' },
            ]}
            value={type}
            onChange={handleTypeChange}
          />
        )}

        <GroupedSection>
          <InputRow
            title={type === 'deposit' ? '예치금' : '월 납입액'}
            value={amountText}
            onChangeText={(t) => {
              setAmountText(formatAmount(Number(t.replace(/[^0-9]/g, ''))));
              setAmountTouched(true);
            }}
            keyboardType="number-pad"
            placeholder="0"
            suffix="원"
          />
          <DateRow title="가입일" value={startDate} onChange={handleStartDateChange} />
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>가입 기간</Text>
            <Segmented
              options={termOptions.map((m) => ({ value: String(m), label: `${m}개월` }))}
              value={String(termMonths)}
              onChange={(v) => handleTermChange(Number(v))}
            />
          </View>
          <InputRow
            title="은행"
            value={bank}
            onChangeText={(v) => {
              setBank(v);
              setShowBankSuggestions(true);
            }}
            onFocus={() => setShowBankSuggestions(true)}
            placeholder="선택"
          />
          {showBankSuggestions &&
            bankSuggestions.map((b) => (
              <ListRow
                key={b}
                title={b}
                tint="primary"
                onPress={() => {
                  setBank(b);
                  setShowBankSuggestions(false);
                }}
              />
            ))}
        </GroupedSection>

        <Pressable style={styles.detailsToggle} onPress={() => setShowDetails((v) => !v)} hitSlop={8}>
          <Text style={styles.detailsToggleText}>세부 정보 {showDetails ? '접기' : '입력'}</Text>
          <Chevron direction={showDetails ? 'up' : 'down'} />
        </Pressable>

        {showDetails && (
          <>
            <GroupedSection footer="금리를 넣으면 만기 때 받을 이자를 계산해 드려요.">
              <InputRow title="별칭" value={name} onChangeText={setName} placeholder={defaultName(type, startDate)} />
              <InputRow title="금리 (연)" value={rateText} onChangeText={setRateText} keyboardType="decimal-pad" placeholder="3.50" suffix="%" />
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>과세 구분</Text>
                <View style={styles.taxControl}>
                  <Segmented
                    options={(Object.keys(TAX_SHORT) as TaxType[]).map((k) => ({ value: k, label: TAX_SHORT[k] }))}
                    value={taxType}
                    onChange={setTaxType}
                  />
                </View>
              </View>
            </GroupedSection>

            <GroupedSection
              footer={
                maturityOverride !== null ? undefined : '만기일은 가입일과 기간으로 자동 계산돼요. 직접 바꿀 수도 있어요.'
              }
            >
              {type === 'savings' && (
                <InputRow title="월 납입일" value={payDayText} onChangeText={setPayDayText} keyboardType="number-pad" placeholder="1~31" suffix="일" />
              )}
              {maturityDate ? <DateRow title="만기일" value={maturityDate} onChange={setMaturityOverride} /> : null}
            </GroupedSection>
            {maturityOverride !== null && (
              <Pressable onPress={() => setMaturityOverride(null)} hitSlop={8}>
                <Text style={styles.resetLink}>만기일 자동 계산으로 되돌리기</Text>
              </Pressable>
            )}

            <GroupedSection>
              <InputRow title="메모" value={memo} onChangeText={setMemo} placeholder="선택" />
            </GroupedSection>

            <Text style={styles.taxNote}>{TAX_TYPE_LABELS[taxType]} 기준으로 이자를 계산해요.</Text>
          </>
        )}
      </FormScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  banner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
  },
  bannerText: {
    fontSize: 13,
    color: colors.primary,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    color: colors.danger,
  },
  taxRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  taxLabel: {
    fontSize: 17,
    color: colors.text,
  },
  taxControl: {
    alignSelf: 'stretch',
  },
  resetLink: {
    fontSize: 13,
    color: colors.primary,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.md,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.sm,
  },
  detailsToggleText: {
    fontSize: 15,
    color: colors.primary,
  },
  taxNote: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
