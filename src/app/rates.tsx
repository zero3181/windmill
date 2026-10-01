import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BankBadge } from '../components/BankBadge';
import { Chip, LinkButton, PrimaryButton, Segmented } from '../components/ui/Controls';
import { Chevron, GroupedSection } from '../components/ui/Grouped';
import { loadProducts, rankProducts, type FinProduct, type ProductsResult } from '../lib/finlife';
import { formatWon } from '../lib/format';
import { useWindmillType } from '../store/WindmillTypeContext';
import { colors, radius, spacing } from '../theme';
import type { AccountType } from '../types/account';
import { pickProduct } from '../lib/productPick';

const TERM_OPTIONS = [6, 12];
const LIST_LIMIT = 30;

/** pick: 가입 페이지 위에 시트로 띄워, 고른 상품을 가입 페이지로 돌려준다 (pick-product 경로). */
export default function RatesScreen({ pick = false }: { pick?: boolean }) {
  const router = useRouter();
  /** step·amount: 풍차 체크리스트에서 들어왔을 때 그 단계와 계좌당 금액 (상품을 고르면 그대로 이어서 등록) */
  const params = useLocalSearchParams<{ term?: string; count?: string; step?: string; amount?: string; type?: AccountType }>();
  // 홈과 공유하는 값을 바꾸면 홈이 다시 되돌려 버려서, 이 화면 안에서만 쓰는 값으로 둔다.
  const { type: homeType } = useWindmillType();
  const [type, setType] = useState<AccountType>(params.type === 'deposit' || params.type === 'savings' ? params.type : homeType);

  const [termMonths, setTermMonths] = useState(Number(params.term) || 12);
  const [paramTerm, setParamTerm] = useState(params.term);
  // 할 일이나 가입 화면에서 다른 기간으로 다시 넘어오면 그 기간으로 맞춘다.
  if (params.term !== paramTerm) {
    setParamTerm(params.term);
    if (params.term) setTermMonths(Number(params.term) || 12);
  }
  const [openOnly, setOpenOnly] = useState(true);
  const [onlineOnly, setOnlineOnly] = useState(true);
  const [firstTierOnly, setFirstTierOnly] = useState(false);
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
          const message = e instanceof Error ? e.message : '금리 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
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

  const ranked = useMemo(
    () =>
      products
        ? rankProducts(products, {
            termMonths,
            openOnly,
            firstTierOnly,
            onlineOnly,
          }).slice(0, LIST_LIMIT)
        : [],
    [products, termMonths, openOnly, onlineOnly, firstTierOnly]
  );

  const disclosureMonth = products?.[0]?.disclosureMonth;
  const planned = planCount > 0 ? ranked.slice(0, planCount) : [];
  const others = planCount > 0 ? ranked.slice(planCount) : ranked;

  function handleRegister(p: FinProduct) {
    if (pick) {
      pickProduct({ bank: p.company, name: p.name, rate: p.rate, termMonths: p.termMonths });
      router.back();
      return;
    }
    const amount = Number(params.amount) || undefined;
    const prefill = { bank: p.company, name: p.name, type, rate: p.rate, termMonths: p.termMonths, amount };
    router.push({
      pathname: '/add-account',
      params: { prefill: JSON.stringify(prefill), from: 'rates', ...(params.step ? { step: params.step } : {}) },
    });
  }

  const renderRow = (p: FinProduct) => (
    <ProductRow
      key={p.id}
      product={p}
      open={expanded === p.id}
      onToggle={() => setExpanded((cur) => (cur === p.id ? null : p.id))}
      onRegister={() => handleRegister(p)}
      registerLabel={pick ? '이 상품 고르기' : '이 상품으로 등록'}
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
          <Chip label={`${openOnly ? '✓ ' : ''}가입 조건 없음`} selected={openOnly} onPress={() => setOpenOnly((v) => !v)} />
          <Chip label={`${onlineOnly ? '✓ ' : ''}비대면 전용`} selected={onlineOnly} onPress={() => setOnlineOnly((v) => !v)} />
          <Chip
            label={`${firstTierOnly ? '✓ ' : ''}1금융권만`}
            selected={firstTierOnly}
            onPress={() => setFirstTierOnly((v) => !v)}
          />
        </View>
        <Text style={styles.source}>
          금융감독원 금융상품한눈에
          {disclosureMonth ? ` · ${disclosureMonth.slice(0, 4)}년 ${Number(disclosureMonth.slice(4))}월 공시` : ''} · 기본 금리순
        </Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <LinkButton label="다시 시도" onPress={handleRefresh} />
        </View>
      ) : !products ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>은행·저축은행 금리를 불러오고 있어요</Text>
        </View>
      ) : ranked.length === 0 ? (
        <Text style={styles.empty}>조건에 맞는 상품이 없어요</Text>
      ) : (
        <>
          {planned.length > 0 && (
            <GroupedSection title={`풍차 ${planCount}개 추천`}>{planned.map(renderRow)}</GroupedSection>
          )}
          {others.length > 0 && (
            <GroupedSection
              title={planned.length > 0 ? '그 외' : undefined}
              footer="가입 조건은 가입 전에 은행에서 확인해 주세요."
            >
              {others.map(renderRow)}
            </GroupedSection>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ProductRow({
  product: p,
  open,
  onToggle,
  onRegister,
  registerLabel,
}: {
  product: FinProduct;
  open: boolean;
  onToggle: () => void;
  onRegister: () => void;
  registerLabel: string;
}) {
  const sub = [p.company, p.reserveType, p.maxRate > p.rate ? `최고 ${p.maxRate.toFixed(2)}%` : undefined]
    .filter(Boolean)
    .join(' · ');
  return (
    <View>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onToggle}>
        <BankBadge bank={p.company} size={28} />
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
          <PrimaryButton label={registerLabel} onPress={onRegister} />
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
