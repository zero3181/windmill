import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Segmented } from '../components/ui/Controls';
import { InputRow } from '../components/ui/FormRows';
import { GroupedSection, ListRow } from '../components/ui/Grouped';
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

function parseAmount(text: string): number {
  return Number(text.replace(/[^0-9]/g, '')) || 0;
}

/** 풍차 만들기: 종류·날개 수·금액만 정하면 할 일 목록이 만들어진다. type 파라미터가 있으면 그 풍차를 고친다. */
export default function CreateWindmillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: AccountType }>();
  const { settings, updateSettings } = useAccounts();
  const { setType: setHomeType } = useWindmillType();

  const editing = params.type ? settings.goals[params.type] : undefined;
  const [type, setType] = useState<AccountType>(params.type ?? 'savings');
  const [blades, setBlades] = useState<WindmillSize>(editing?.blades ?? 12);
  const [total, setTotal] = useState(editing?.total ?? 0);

  const perAccount = Math.floor(total / blades);
  const unit = UNIT[type];

  const amountFooter =
    perAccount <= 0
      ? type === 'savings'
        ? '풍차가 다 돌았을 때 매달 저금하게 될 금액이에요.'
        : '풍차에 넣을 목돈 전체예요.'
      : type === 'savings'
        ? `적금 ${blades}개에 ${formatManwon(perAccount)}씩 나눠 넣어요. 첫 달은 ${formatManwon(perAccount)}으로 시작해 한 달에 하나씩 늘어, ${blades}개월째부터 매달 ${formatManwon(perAccount * blades)}이 돼요.`
        : `예금 ${blades}개에 ${formatManwon(perAccount)}씩 나눠, 매달 하나씩 넣어요.`;

  async function handleSave() {
    if (perAccount <= 0) {
      Alert.alert('금액을 입력해 주세요', `${type === 'savings' ? '매달 저금할 금액' : '총 저금액'}을 알려 주세요.`);
      return;
    }
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
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>취소</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button variant="done" onPress={handleSave}>
          {editing ? '저장' : '만들기'}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <FormScrollView contentContainerStyle={styles.content}>
        <View style={styles.art}>
          <Windmill blades={blades} filled={allBlades(blades)} width={180} />
        </View>

        {!editing && (
          <GroupedSection
            title="어떤 풍차를 만들까요?"
            footer={
              type === 'savings'
                ? '적금 풍차: 월급에서 매달 조금씩 모을 때 좋아요.'
                : '예금 풍차: 모아둔 목돈을 나눠 넣고, 필요할 때 일부만 꺼내 쓸 수 있어요.'
            }
          >
            <View style={styles.segmentRow}>
              <Segmented
                options={[
                  { value: 'savings', label: '적금 풍차' },
                  { value: 'deposit', label: '예금 풍차' },
                ]}
                value={type}
                onChange={setType}
              />
            </View>
          </GroupedSection>
        )}

        <GroupedSection
          title="날개 수"
          footer={`매달 ${unit}을 하나씩 ${blades}번 가입해요. ${unit} 하나의 기간은 ${blades}개월이라, 풍차가 다 돌면 매달 만기가 돌아와요.`}
        >
          <View style={styles.segmentRow}>
            <Segmented
              options={WINDMILL_SIZES.map((s) => ({ value: String(s), label: `${s}개` }))}
              value={String(blades)}
              onChange={(v) => setBlades(Number(v) as WindmillSize)}
            />
          </View>
        </GroupedSection>

        <GroupedSection title="금액" footer={amountFooter}>
          <InputRow
            title={type === 'savings' ? '매달 저금할 금액' : '총 저금액'}
            value={total > 0 ? total.toLocaleString('ko-KR') : ''}
            onChangeText={(t) => setTotal(parseAmount(t))}
            keyboardType="number-pad"
            placeholder={type === 'savings' ? '1,200,000' : '12,000,000'}
            suffix="원"
          />
        </GroupedSection>

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
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  art: {
    alignItems: 'center',
  },
  segmentRow: {
    padding: spacing.md,
  },
});
