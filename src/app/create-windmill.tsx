import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Segmented } from '../components/ui/Controls';
import { InputRow } from '../components/ui/FormRows';
import { GroupedSection, ListRow } from '../components/ui/Grouped';
import { HeaderActions } from '../components/ui/HeaderActions';
import { RampChart } from '../components/RampChart';
import { Windmill } from '../components/Windmill';
import { allBlades } from '../lib/blades';
import { formatManwon } from '../lib/format';
import { WINDMILL_SIZES, type WindmillSize } from '../lib/settings';
import { useAccounts } from '../store/AccountsContext';
import { useWindmillType } from '../store/WindmillTypeContext';
import { spacing } from '../theme';
import type { AccountType } from '../types/account';
import { FormScrollView } from '../components/ui/FormScrollView';

const UNIT: Record<AccountType, string> = { savings: '적금', deposit: '예금' };
/**
 * 처음 만들 때 채워 둘 금액. 적금은 계좌 하나에 월 10만 원, 예금은 계좌 하나에 100만 원이 되도록
 * 날개 수에 맞춘다 (예금은 큰 숫자가 부담스럽지 않게 낮게 둔다).
 */
const DEFAULT_TOTAL: Record<AccountType, Record<WindmillSize, number>> = {
  savings: { 6: 600_000, 12: 1_200_000 },
  deposit: { 6: 6_000_000, 12: 12_000_000 },
};
/** 금액 칸 제목: 예금은 이미 가진 목돈을 나누는 것이라 '얼마 있는지'로 묻는다 */
const AMOUNT_TITLE: Record<AccountType, string> = { savings: '매달 저금할 금액', deposit: '모아 둔 목돈' };

/** 12개월은 '1년'처럼 읽기 쉽게 */
function termLabel(months: number): string {
  return months % 12 === 0 ? `${months / 12}년` : `${months}개월`;
}

function parseAmount(text: string): number {
  return Number(text.replace(/[^0-9]/g, '')) || 0;
}

/** 풍차 만들기: 종류·날개 수·금액만 정하면 할 일 목록이 만들어진다. type 파라미터가 있으면 그 풍차를 고친다. */
export default function CreateWindmillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: AccountType }>();
  const { accounts, settings, updateSettings } = useAccounts();
  const { setType: setHomeType } = useWindmillType();

  const editing = params.type ? settings.goals[params.type] : undefined;
  const [type, setType] = useState<AccountType>(params.type ?? 'savings');
  const [blades, setBlades] = useState<WindmillSize>(editing?.blades ?? 12);
  const [total, setTotal] = useState(editing?.total ?? DEFAULT_TOTAL[type][editing?.blades ?? 12]);
  const [totalTouched, setTotalTouched] = useState(Boolean(editing));

  function handleTypeChange(next: AccountType) {
    setType(next);
    // 금액을 아직 고치지 않았으면 종류에 맞는 초기 금액으로 바꾼다.
    if (!totalTouched) setTotal(DEFAULT_TOTAL[next][blades]);
  }

  function handleBladesChange(next: WindmillSize) {
    setBlades(next);
    if (!totalTouched) setTotal(DEFAULT_TOTAL[type][next]);
  }

  const perAccount = Math.floor(total / blades);
  // 날개 수와 기간이 다른 계좌는 풍차에 들어가지 않는다는 것을 미리 알려 준다.
  const outsideCount = accounts.filter((a) => a.status === 'active' && a.type === type && a.termMonths !== blades).length;
  const unit = UNIT[type];

  // 적금은 아래 막대 그림이 늘어나는 금액을 보여 주므로, 계좌 하나 금액만 적는다.
  const amountFooter =
    perAccount <= 0
      ? undefined
      : type === 'savings'
        ? `계좌 하나에 월 ${formatManwon(perAccount)}`
        : `계좌 하나에 ${formatManwon(perAccount)}`;

  async function handleSave() {
    if (perAccount <= 0) {
      Alert.alert('금액을 입력해 주세요', `${AMOUNT_TITLE[type]}을 알려 주세요.`);
      return;
    }
    // 새로 만들다가 이미 있는 종류를 고르면 그 풍차를 덮어쓰게 되므로 먼저 묻는다.
    if (settings.goals[type] && editing !== settings.goals[type]) {
      Alert.alert(`${unit} 풍차가 이미 있어요`, '지금 정한 날개 수와 금액으로 바꿀까요?', [
        { text: '취소', style: 'cancel' },
        { text: '바꾸기', onPress: () => void save() },
      ]);
      return;
    }
    await save();
  }

  async function save() {
    await updateSettings({
      goals: { ...settings.goals, [type]: { blades, total } },
      windmillSize: { ...settings.windmillSize, [type]: blades },
    });
    setHomeType(type);
    router.back();
  }

  function handleRemove() {
    Alert.alert('풍차 지우기', '할 일만 지워지고, 등록한 계좌는 그대로 남아요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: async () => {
          await updateSettings({ goals: { ...settings.goals, [type]: undefined } });
          router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: editing ? `${unit} 풍차 수정` : '풍차 만들기' }} />
      <HeaderActions
        left={{ label: '취소', onPress: () => router.back() }}
        right={{ label: editing ? '저장' : '만들기', onPress: handleSave, done: true }}
      />

      <FormScrollView contentContainerStyle={styles.content}>
        <View style={styles.art}>
          <Windmill blades={blades} filled={allBlades(blades)} width={180} type={type} />
        </View>

        {!editing && (
          <GroupedSection title="어떤 풍차를 만들까요?" bare>
            <Segmented
              options={[
                { value: 'savings', label: '적금 풍차' },
                { value: 'deposit', label: '예금 풍차' },
              ]}
              value={type}
              onChange={handleTypeChange}
            />
          </GroupedSection>
        )}

        <GroupedSection
          title="날개 수 (만기 개월 수)"
          bare
          footer={
            `매달 ${termLabel(blades)} 만기 ${unit}을 ${blades}번 가입해요.` +
            (outsideCount > 0 ? ` ${termLabel(blades)}이 아닌 ${unit} ${outsideCount}개는 날개를 채우지 않아요.` : '')
          }
        >
          <Segmented
            options={WINDMILL_SIZES.map((s) => ({ value: String(s), label: `${s}개` }))}
            value={String(blades)}
            onChange={(v) => handleBladesChange(Number(v) as WindmillSize)}
          />
        </GroupedSection>

        <GroupedSection title={AMOUNT_TITLE[type]} footer={amountFooter}>
          <InputRow
            value={total > 0 ? total.toLocaleString('ko-KR') : ''}
            onChangeText={(t) => {
              setTotal(parseAmount(t));
              setTotalTouched(true);
            }}
            keyboardType="number-pad"
            placeholder={DEFAULT_TOTAL[type][blades].toLocaleString('ko-KR')}
            suffix="원"
          />
        </GroupedSection>

        {type === 'savings' && perAccount > 0 && <RampChart perAccount={perAccount} blades={blades} />}

        {editing && (
          <GroupedSection>
            <ListRow title="풍차 지우기" tint="destructive" onPress={handleRemove} />
          </GroupedSection>
        )}
      </FormScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.xl - 4,
  },
  art: {
    alignItems: 'center',
  },
});
