import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BANKS } from '../lib/banks';
import { computeMaturityDate, parseISODate, todayKST } from '../lib/calc';
import { onProductPick, type ProductPick } from '../lib/productPick';
import { colors, radius, spacing } from '../theme';
import { type Account, type AccountType, type NewAccountInput, type TaxType } from '../types/account';
import { BankBadge } from './BankBadge';
import { Segmented } from './ui/Controls';
import { DateRow, InputRow, PickerRow } from './ui/FormRows';
import { Chevron, GroupedSection, ListRow } from './ui/Grouped';
import { FormScrollView } from './ui/FormScrollView';

interface Props {
  initial?: Partial<Account>;
  /** 이미 등록한 계좌의 은행 (목록에 없던 이름도 다시 고를 수 있게 선택지에 더한다) */
  knownBanks: string[];

  defaultTaxType: TaxType;
  submitLabel: string;
  /** 폼 위에 띄울 안내 (예: 금리 비교에서 고른 상품 정보가 채워졌다는 안내) */
  banner?: string;
  /** 종류별 기본 금액: 이미 가입한 같은 종류 계좌의 금액 (매번 입력하지 않도록) */
  defaultAmounts?: Partial<Record<AccountType, number>>;
  /** 종류별 기본 금리 (%): 이미 가입한 같은 종류 계좌의 금리, 없으면 DEFAULT_RATE */
  defaultRates?: Partial<Record<AccountType, number>>;
  /** 풍차 체크리스트에서 들어오면 종류가 정해져 있어 고르지 않는다. */
  lockedType?: boolean;
  /** 종류별 풍차 날개 수 = 풍차에 들어가는 계좌의 가입 기간 (풍차를 만든 종류만) */
  windmillTerms?: Partial<Record<AccountType, number>>;
  /** 폼 맨 위에 둘 안내 (체크리스트 단계의 가입 조건 등) */
  header?: React.ReactNode;
  /** 이율·과세·납입일 등 세부 항목을 처음부터 펼칠지 (기존 계좌 편집) */
  detailsOpen?: boolean;
  onSubmit: (input: NewAccountInput) => Promise<void>;
}

const TAX_SHORT: Record<TaxType, string> = { general: '일반과세', preferential: '세금우대', exempt: '비과세' };
const UNIT: Record<AccountType, string> = { savings: '적금', deposit: '예금' };
const CUSTOM_BANK = '__custom__';
/** 같은 종류로 가입한 계좌가 없을 때 채워 둘 금리 (%) */
const DEFAULT_RATE: Record<AccountType, number> = { savings: 3.5, deposit: 3.0 };

function isListedBank(name: string, knownBanks: string[]): boolean {
  return (BANKS as readonly string[]).includes(name) || knownBanks.includes(name);
}

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
  defaultRates = {},
  lockedType = false,
  windmillTerms = {},
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
  const rateFor = (t: AccountType) => String(defaultRates[t] ?? DEFAULT_RATE[t]);
  const [rateText, setRateText] = useState(initial?.rate ? String(initial.rate) : rateFor(initial?.type ?? 'savings'));
  const [rateTouched, setRateTouched] = useState(Boolean(initial?.rate));
  const [taxType, setTaxType] = useState<TaxType>(initial?.taxType ?? defaultTaxType);
  const [startDate, setStartDate] = useState<string>(initial?.startDate ?? todayKST());
  // 풍차가 있으면 그 풍차의 기간(날개 수)을 기본으로 한다.
  const [termMonths, setTermMonths] = useState(
    initial?.termMonths ?? windmillTerms[initial?.type ?? 'savings'] ?? 12
  );
  const [termTouched, setTermTouched] = useState(Boolean(initial?.termMonths));
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
  // 목록에 없는 은행 이름은 '직접 입력'으로 받는다.
  const [customBank, setCustomBank] = useState(Boolean(initial?.bank) && !isListedBank(initial?.bank ?? '', knownBanks));
  const [bankOpen, setBankOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(detailsOpen);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termOptions = Array.from(new Set([6, 12, initial?.termMonths ?? 12])).sort((a, b) => a - b);
  const computedMaturity = useMemo(
    () => (startDate && termMonths > 0 ? computeMaturityDate(startDate, termMonths) : ''),
    [startDate, termMonths]
  );
  const maturityDate = maturityOverride ?? computedMaturity;

  const bankOptions = useMemo(
    () => [
      ...[...BANKS, ...knownBanks.filter((b) => !(BANKS as readonly string[]).includes(b))].map((b) => ({
        value: b,
        label: b,
        icon: <BankBadge bank={b} />,
      })),
      { value: CUSTOM_BANK, label: '직접 입력' },
    ],
    [knownBanks]
  );

  // 이 폼 위에 띄운 금리 비교에서 상품을 고르면 은행·상품명·금리를 채운다. 금리는 세부 정보에 있어 함께 펼친다.
  useEffect(
    () =>
      onProductPick((pick: ProductPick) => {
        setBank(pick.bank);
        setCustomBank(!isListedBank(pick.bank, knownBanks));
        setName(pick.name);
        setRateText(String(pick.rate));
        setRateTouched(true);
        if (!lockedType && [6, 12].includes(pick.termMonths)) {
          setTermMonths(pick.termMonths);
          setMaturityOverride(null);
          setTermTouched(true);
        }
        setShowDetails(true);
      }),
    [knownBanks, lockedType]
  );

  function handleStartDateChange(iso: string) {
    setStartDate(iso);
    // 가입일을 바꾸면 만기일도 가입 기간에 맞춰 다시 계산한다.
    setMaturityOverride(null);
    if (!initial?.payDay) setPayDayText(String(parseISODate(iso).d));
  }

  function handleTermChange(months: number, byUser = true) {
    setTermMonths(months);
    setMaturityOverride(null);
    if (byUser) setTermTouched(true);
  }

  function handleTypeChange(next: AccountType) {
    setType(next);
    if (!amountTouched) setAmountText(formatAmount(defaultAmounts[next]));
    if (!rateTouched) setRateText(rateFor(next));
    if (!termTouched && windmillTerms[next]) handleTermChange(windmillTerms[next], false);
  }

  const windmillTerm = windmillTerms[type];
  const outsideWindmill = windmillTerm !== undefined && termMonths !== windmillTerm;

  function validate(): string | null {
    const amount = Number(amountText.replace(/,/g, ''));
    if (!amount || amount <= 0) return '금액을 입력해 주세요';
    const rate = Number(rateText);
    if (!rateText || isNaN(rate) || rate <= 0) return '금리를 입력해 주세요';
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

        <GroupedSection
          footer={
            outsideWindmill
              ? `${windmillTerm}개월 ${UNIT[type]}이 아니라 풍차 날개를 채우지 않아요.`
              : undefined
          }
        >
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
          <InputRow
            title="금리 (연)"
            value={rateText}
            onChangeText={(t) => {
              setRateText(t);
              setRateTouched(true);
            }}
            keyboardType="decimal-pad"
            placeholder={rateFor(type)}
            suffix="%"
          />
          <DateRow title="가입일" value={startDate} onChange={handleStartDateChange} />
          {lockedType ? (
            // 할 일에서 가입할 때는 풍차 주기에 맞는 기간만 가능하다.
            <ListRow title="가입 기간" detail={`${termMonths}개월`} />
          ) : (
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>가입 기간</Text>
              <Segmented
                options={termOptions.map((m) => ({ value: String(m), label: `${m}개월` }))}
                value={String(termMonths)}
                onChange={(v) => handleTermChange(Number(v))}
              />
            </View>
          )}
          <PickerRow
            title="은행"
            options={bankOptions}
            value={customBank ? CUSTOM_BANK : bank}
            placeholder="선택"
            onChange={(v) => {
              setCustomBank(v === CUSTOM_BANK);
              setBank(v === CUSTOM_BANK ? '' : v);
            }}
            open={bankOpen}
            onToggle={() => setBankOpen((o) => !o)}
          />
          {customBank && <InputRow title="은행 이름" value={bank} onChangeText={setBank} placeholder="OO저축은행" />}
        </GroupedSection>

        <Pressable style={styles.detailsToggle} onPress={() => setShowDetails((v) => !v)} hitSlop={8}>
          <Text style={styles.detailsToggleText}>세부 정보 {showDetails ? '접기' : '입력'}</Text>
          <Chevron direction={showDetails ? 'up' : 'down'} />
        </Pressable>

        {showDetails && (
          <>
            <GroupedSection>
              <InputRow title="별칭" value={name} onChangeText={setName} placeholder={defaultName(type, startDate)} />
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

            <GroupedSection>
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
});
