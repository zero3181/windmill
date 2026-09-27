import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, PrimaryButton, Segmented } from '../components/ui/Controls';
import { Chevron, GroupedSection } from '../components/ui/Grouped';
import { loadProducts, rankProducts, type FinProduct, type ProductsResult } from '../lib/finlife';
import { formatWon } from '../lib/format';
import { useAccounts } from '../store/AccountsContext';
import { useWindmillType } from '../store/WindmillTypeContext';
import { colors, radius, spacing } from '../theme';
import type { AccountType } from '../types/account';

const TERM_OPTIONS = [6, 12];
const LIST_LIMIT = 30;

export default function RatesScreen() {
  const router = useRouter();
  /** step·amount: 풍차 체크리스트에서 들어왔을 때 그 단계와 계좌당 금액 (상품을 고르면 그대로 이어서 등록) */
  const params = useLocalSearchParams<{ term?: string; count?: string; step?: string; amount?: string }>();
  const { accounts } = useAccounts();
  const { type, setType } = useWindmillType();

  const [termMonths, setTermMonths] = useState(Number(params.term) || 12);
  const [paramTerm, setParamTerm] = useState(params.term);
  // 계산기나 체크리스트에서 다른 기간으로 다시 넘어오면 그 기간으로 맞춘다.
  if (params.term !== paramTerm) {
    setParamTerm(params.term);
    if (params.term) setTermMonths(Number(params.term) || 12);
  }
  const [excludeMine, setExcludeMine] = useState(true);
  const [openOnly, setOpenOnly] = useState(true);
  const [onlineOnly, setOnlineOnly] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const planCount = Number(params.count) || 0;

  const [results, setResults] = useState<Partial<Record<AccountType, ProductsResult>>>({});
  const [errors, setErrors] = useState<Partial<Record<AccountType, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const products = results[type]?.products ?? null;
  const error = errors[type] ?? null;

  const load = useCallback(
    (force = false) =>
      loadProducts(type, { force }).then(
        (result) => {
          setResults((prev) => ({ ...prev, [type]: result }));
          setErrors((prev) => ({ ...prev, [type]: undefined }));
        },
        (e: unknown) => {
          const message = e instanceof Error ? e.message : '금리 정보를 불러오지 못했어요';
          setErrors((prev) => ({ ...prev, [type]: message }));
        }
      ),
    [type]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  const myCompanies = useMemo(
    () => Array.from(new Set(accounts.filter((a) => a.status === 'active').map((a) => a.bank))),
    [accounts]
  );

  const ranked = useMemo(
    () =>
      products
        ? rankProducts(products, {
            termMonths,
            excludeCompanies: excludeMine ? myCompanies : [],
            openOnly,
            onlineOnly,
          }).slice(0, LIST_LIMIT)
        : [],
    [products, termMonths, excludeMine, myCompanies, openOnly, onlineOnly]
  );

  const disclosureMonth = products?.[0]?.disclosureMonth;
  const planned = planCount > 0 ? ranked.slice(0, planCount) : [];
  const others = planCount > 0 ? ranked.slice(planCount) : ranked;

  function handleRegister(p: FinProduct) {
    const amount = Number(params.amount) || undefined;
    const prefill = { bank: p.company, name: p.name, type, rate: p.rate, termMonths: p.termMonths, amount };
    router.push({
      pathname: '/add-account',
      params: { prefill: JSON.stringify(prefill), from: 'rates', ...(params.step ? { step: params.step } : {}) },
    });
  }

  const renderRow = (p: FinProduct, i: number) => (
    <ProductRow
      key={p.id}
      rank={i + 1}
      product={p}
      open={expanded === p.id}
      onToggle={() => setExpanded((cur) => (cur === p.id ? null : p.id))}
      onRegister={() => handleRegister(p)}
    />
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Segmented
        options={[
          { value: 'savings', label: '적금' },
          { value: 'deposit', label: '예금' },
        ]}
        value={type}
        onChange={setType}
      />

      <View style={styles.filters}>
        <View style={styles.chips}>
          {TERM_OPTIONS.map((t) => (
            <Chip key={t} label={`${t}개월`} selected={termMonths === t} onPress={() => setTermMonths(t)} />
          ))}
        </View>
        <View style={styles.chips}>
          <Chip label={`${openOnly ? '✓ ' : ''}가입조건 없음`} selected={openOnly} onPress={() => setOpenOnly((v) => !v)} />
          <Chip label={`${onlineOnly ? '✓ ' : ''}비대면 전용`} selected={onlineOnly} onPress={() => setOnlineOnly((v) => !v)} />
          {myCompanies.length > 0 && (
            <Chip label={`${excludeMine ? '✓ ' : ''}가입한 곳 제외`} selected={excludeMine} onPress={() => setExcludeMine((v) => !v)} />
          )}
        </View>
        <Text style={styles.source}>
          금융감독원 금융상품한눈에
          {disclosureMonth ? ` · ${disclosureMonth.slice(0, 4)}년 ${Number(disclosureMonth.slice(4))}월 공시` : ''} · 기본 금리순
        </Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton label="다시 시도" variant="plain" onPress={handleRefresh} />
        </View>
      ) : !products ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>은행·저축은행 금리를 불러오는 중...</Text>
        </View>
      ) : ranked.length === 0 ? (
        <Text style={styles.empty}>조건에 맞는 상품이 없어요</Text>
      ) : (
        <>
          {planned.length > 0 && (
            <GroupedSection title={`풍차 ${planCount}개 추천`}>{planned.map((p, i) => renderRow(p, i))}</GroupedSection>
          )}
          {others.length > 0 && (
            <GroupedSection
              title={planned.length > 0 ? '그 외' : undefined}
              footer="가입 대상 문구로 판단한 결과예요. 1인 1계좌 등 세부 조건은 가입 전에 확인하세요. 같은 금융회사는 기본 금리가 가장 높은 상품 하나만 보여줘요."
            >
              {others.map((p, i) => renderRow(p, planned.length + i))}
            </GroupedSection>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ProductRow({
  rank,
  product: p,
  open,
  onToggle,
  onRegister,
}: {
  rank: number;
  product: FinProduct;
  open: boolean;
  onToggle: () => void;
  onRegister: () => void;
}) {
  const sub = [p.company, p.reserveType, p.maxRate > p.rate ? `최고 ${p.maxRate.toFixed(2)}%` : undefined]
    .filter(Boolean)
    .join(' · ');
  return (
    <View>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onToggle}>
        <Text style={styles.rank}>{rank}</Text>
        <View style={styles.rowMain}>
          <Text style={styles.name} numberOfLines={open ? undefined : 1}>
            {p.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        <Text style={styles.rate}>{p.rate.toFixed(2)}%</Text>
        <Chevron direction={open ? 'up' : 'down'} />
      </Pressable>
      {open && (
        <View style={styles.details}>
          <Detail label="가입 대상" value={p.joinMember} />
          <Detail label="가입 방법" value={p.joinWay} />
          {p.maxLimit ? <Detail label="한도" value={formatWon(p.maxLimit)} /> : null}
          {p.specialCondition && !/^(없음|해당없음|-)$/.test(p.specialCondition) && (
            <Detail label="우대 조건" value={p.specialCondition} />
          )}
          {p.note && !/^(없음|해당없음|-|\.)$/.test(p.note) && <Detail label="참고" value={p.note} />}
          <PrimaryButton label="이 상품으로 계좌 등록" onPress={onRegister} />
        </View>
      )}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  filters: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  source: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.barEmpty,
  },
  rank: {
    width: 20,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textFaint,
  },
  rowMain: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    color: colors.text,
  },
  sub: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 1,
  },
  rate: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  details: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  detail: {
    gap: 2,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
});
