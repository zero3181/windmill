import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { computeMaturityDate, parseISODate, todayKST } from '../lib/calc';
import { formatDateFull } from '../lib/format';
import { TAX_TYPE_LABELS, type Account, type AccountType, type NewAccountInput, type TaxType } from '../types/account';
import { colors, radius, spacing } from '../theme';

interface Props {
  initial?: Partial<Account>;
  knownBanks: string[];
  defaultTaxType: TaxType;
  submitLabel: string;
  onSubmit: (input: NewAccountInput) => Promise<void>;
}

function toISODateFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDateFromISO(iso: string): Date {
  const { y, m, d } = parseISODate(iso);
  return new Date(y, m - 1, d);
}

export function AccountForm({ initial, knownBanks, defaultTaxType, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [bank, setBank] = useState(initial?.bank ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'deposit');
  const [amountText, setAmountText] = useState(initial?.amount ? String(initial.amount) : '');
  const [rateText, setRateText] = useState(initial?.rate ? String(initial.rate) : '');
  const [taxType, setTaxType] = useState<TaxType>(initial?.taxType ?? defaultTaxType);
  const [startDate, setStartDate] = useState<string>(initial?.startDate ?? todayKST());
  const [termMonthsText, setTermMonthsText] = useState(String(initial?.termMonths ?? 12));
  const [payDayText, setPayDayText] = useState(
    initial?.payDay ? String(initial.payDay) : String(parseISODate(initial?.startDate ?? todayKST()).d)
  );
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [maturityOverride, setMaturityOverride] = useState<string | null>(initial?.maturityDate ?? null);
  const [showMaturityPicker, setShowMaturityPicker] = useState(false);
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termMonths = parseInt(termMonthsText, 10) || 0;
  const computedMaturity = useMemo(
    () => (startDate && termMonths > 0 ? computeMaturityDate(startDate, termMonths) : ''),
    [startDate, termMonths]
  );
  const maturityDate = maturityOverride ?? computedMaturity;

  const bankSuggestions = useMemo(() => {
    if (!bank) return [];
    return knownBanks.filter((b) => b.includes(bank) && b !== bank).slice(0, 5);
  }, [bank, knownBanks]);

  function handleStartDateChange(_event: unknown, date?: Date) {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      const iso = toISODateFromDate(date);
      setStartDate(iso);
      if (!initial?.payDay) {
        setPayDayText(String(parseISODate(iso).d));
      }
    }
  }

  function handleMaturityDateChange(_event: unknown, date?: Date) {
    setShowMaturityPicker(Platform.OS === 'ios');
    if (date) {
      setMaturityOverride(toISODateFromDate(date));
    }
  }

  function validate(): string | null {
    if (!name.trim()) return '별칭을 입력해주세요';
    if (!bank.trim()) return '은행을 입력해주세요';
    const amount = Number(amountText.replace(/,/g, ''));
    if (!amount || amount <= 0) return '금액을 입력해주세요';
    const rate = Number(rateText);
    if (isNaN(rate) || rate < 0) return '금리를 입력해주세요';
    if (!termMonths || termMonths <= 0) return '가입 기간을 입력해주세요';
    if (type === 'savings') {
      const payDay = Number(payDayText);
      if (!payDay || payDay < 1 || payDay > 31) return '납입일은 1~31 사이로 입력해주세요';
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
        name: name.trim(),
        bank: bank.trim(),
        type,
        amount: Number(amountText.replace(/,/g, '')),
        rate: Number(rateText),
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="별칭">
          <TextInput
            style={styles.input}
            placeholder="예: 3월 적금"
            value={name}
            onChangeText={setName}
          />
        </Field>

        <Field label="은행">
          <TextInput
            style={styles.input}
            placeholder="예: OO저축은행"
            value={bank}
            onChangeText={(v) => {
              setBank(v);
              setShowBankSuggestions(true);
            }}
            onFocus={() => setShowBankSuggestions(true)}
          />
          {showBankSuggestions && bankSuggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              {bankSuggestions.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setBank(b);
                    setShowBankSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionText}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        <Field label="종류">
          <SegmentedControl
            options={[
              { value: 'deposit', label: '예금' },
              { value: 'savings', label: '적금' },
            ]}
            value={type}
            onChange={(v) => setType(v as AccountType)}
          />
        </Field>

        <Field label={type === 'deposit' ? '예치 원금' : '월 납입액'}>
          <TextInput
            style={styles.input}
            placeholder="예: 1000000"
            keyboardType="number-pad"
            value={amountText}
            onChangeText={setAmountText}
          />
        </Field>

        <Field label="연 이율 (%)">
          <TextInput
            style={styles.input}
            placeholder="예: 3.50"
            keyboardType="decimal-pad"
            value={rateText}
            onChangeText={setRateText}
          />
        </Field>

        <Field label="과세 구분">
          <SegmentedControl
            options={(Object.keys(TAX_TYPE_LABELS) as TaxType[]).map((k) => ({
              value: k,
              label: TAX_TYPE_LABELS[k],
            }))}
            value={taxType}
            onChange={(v) => setTaxType(v as TaxType)}
            compact
          />
        </Field>

        <Field label="가입일">
          <TouchableOpacity style={styles.input} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateText}>{formatDateFull(startDate)}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={toDateFromISO(startDate)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}
        </Field>

        <Field label="가입 기간 (개월)">
          <TextInput
            style={styles.input}
            placeholder="12"
            keyboardType="number-pad"
            value={termMonthsText}
            onChangeText={setTermMonthsText}
          />
        </Field>

        {type === 'savings' && (
          <Field label="월 납입일">
            <TextInput
              style={styles.input}
              placeholder="1~31"
              keyboardType="number-pad"
              value={payDayText}
              onChangeText={setPayDayText}
            />
          </Field>
        )}

        <Field label="만기일">
          <TouchableOpacity style={styles.input} onPress={() => setShowMaturityPicker(true)}>
            <Text style={styles.dateText}>{maturityDate ? formatDateFull(maturityDate) : '-'}</Text>
          </TouchableOpacity>
          {maturityOverride !== null && (
            <TouchableOpacity onPress={() => setMaturityOverride(null)}>
              <Text style={styles.resetLink}>자동 계산으로 되돌리기</Text>
            </TouchableOpacity>
          )}
          {showMaturityPicker && (
            <DateTimePicker
              value={toDateFromISO(maturityDate || todayKST())}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleMaturityDateChange}
            />
          )}
        </Field>

        <Field label="메모 (선택)">
          <TextInput
            style={styles.input}
            placeholder="한 줄 메모"
            value={memo}
            onChangeText={setMemo}
          />
        </Field>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? '저장 중...' : submitLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[styles.segmentText, selected && styles.segmentTextSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit={compact}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 15,
    color: colors.text,
  },
  suggestionBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentSelected: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: colors.primary,
  },
  resetLink: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
