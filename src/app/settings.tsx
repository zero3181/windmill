import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch } from 'react-native';
import { GroupedSection, ListRow } from '../components/ui/Grouped';
import { exportBackup, pickAndParseBackup } from '../lib/backup';
import { ensureNotificationSetup } from '../lib/notifications';
import { useAccounts } from '../store/AccountsContext';
import { colors, spacing } from '../theme';
import { TAX_TYPE_LABELS, type TaxType } from '../types/account';

export default function SettingsScreen() {
  const { accounts, rawSettings, settings, updateSettings, restoreFromBackup } = useAccounts();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      await exportBackup(accounts, rawSettings);
    } catch (e) {
      Alert.alert('내보내기 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    try {
      const payload = await pickAndParseBackup();
      if (!payload) return;

      Alert.alert(
        '백업 가져오기',
        `${payload.accounts.length}개 계좌를 가져올까요? 지금 이 기기에 있는 기록은 백업 내용으로 바뀌어요.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '가져오기',
            style: 'destructive',
            onPress: async () => {
              await restoreFromBackup(payload.accounts, payload.settings);
              Alert.alert('완료', '백업을 가져왔어요');
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('가져오기 실패', e instanceof Error ? e.message : '풍차돌리기 백업 파일인지 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  function toggle(value: boolean, onChange: (v: boolean) => void) {
    // 알림을 켜는 순간 아직 권한이 없으면 묻는다.
    const handleChange = async (v: boolean) => {
      if (v) await ensureNotificationSetup(true).catch(() => false);
      onChange(v);
    };
    return <Switch value={value} onValueChange={handleChange} trackColor={{ true: colors.success }} />;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <GroupedSection title="내 풍차">
        {(['savings', 'deposit'] as const).map((t) => {
          const goal = settings.goals[t];
          const label = t === 'savings' ? '적금 풍차' : '예금 풍차';
          return (
            <ListRow
              key={t}
              title={goal ? `${label} 수정` : `${label} 만들기`}
              detail={goal ? `날개 ${goal.blades}개` : undefined}
              chevron
              onPress={() => router.push({ pathname: '/create-windmill', params: goal ? { type: t } : {} })}
            />
          );
        })}
      </GroupedSection>

      <GroupedSection title="세부 기능">
        <ListRow title="풍차 계산기" chevron onPress={() => router.push('/calculator')} />
        <ListRow title="금리 비교" chevron onPress={() => router.push('/rates')} />
        <ListRow title="계좌 직접 등록" chevron onPress={() => router.push('/add-account')} />
      </GroupedSection>

      <GroupedSection title="알림">
        <ListRow title="만기 D-7 알림" right={toggle(settings.notifyD7, (v) => updateSettings({ notifyD7: v }))} />
        <ListRow title="만기 당일 알림" right={toggle(settings.notifyDday, (v) => updateSettings({ notifyDday: v }))} />
        <ListRow
          title="적금 납입일 알림"
          subtitle="오전 9시"
          right={toggle(settings.notifyPayday, (v) => updateSettings({ notifyPayday: v }))}
        />
      </GroupedSection>

      <GroupedSection title="기본 과세 구분">
        {(Object.keys(TAX_TYPE_LABELS) as TaxType[]).map((key) => (
          <ListRow
            key={key}
            title={TAX_TYPE_LABELS[key]}
            detail={settings.defaultTaxType === key ? '✓' : undefined}
            detailStyle={styles.check}
            onPress={() => updateSettings({ defaultTaxType: key })}
          />
        ))}
      </GroupedSection>

      <GroupedSection title="백업">
        <ListRow title="백업 파일 내보내기" tint="primary" onPress={busy ? undefined : handleExport} />
        <ListRow title="백업 파일에서 가져오기" tint="primary" onPress={busy ? undefined : handleImport} />
      </GroupedSection>

      <GroupedSection title="도움말">
        <ListRow title="풍차돌리기 소개 다시 보기" chevron onPress={() => router.push('/onboarding')} />
      </GroupedSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl - 4,
  },
  check: {
    color: colors.primary,
    fontWeight: '600',
  },
});
