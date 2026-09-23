import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { exportBackup, pickAndParseBackup } from '../lib/backup';
import { useAccounts } from '../store/AccountsContext';
import { TAX_TYPE_LABELS, type TaxType } from '../types/account';
import { colors, radius, spacing } from '../theme';

export default function SettingsScreen() {
  const { accounts, rawSettings, settings, updateSettings, restoreFromBackup } = useAccounts();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      await exportBackup(accounts, rawSettings);
    } catch (e) {
      Alert.alert('내보내기 실패', e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요');
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
        `${payload.accounts.length}개 계좌를 가져올까요? 현재 기기의 데이터는 백업 내용으로 대체돼요.`,
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
      Alert.alert('가져오기 실패', e instanceof Error ? e.message : '올바르지 않은 백업 파일이에요');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="알림">
        <ToggleRow
          label="만기 D-7 알림"
          value={settings.notifyD7}
          onChange={(v) => updateSettings({ notifyD7: v })}
        />
        <ToggleRow
          label="만기 당일 알림"
          value={settings.notifyDday}
          onChange={(v) => updateSettings({ notifyDday: v })}
        />
        <ToggleRow
          label="적금 납입일 알림 (오전 9시)"
          value={settings.notifyPayday}
          onChange={(v) => updateSettings({ notifyPayday: v })}
        />
      </Section>

      <Section title="기본 과세 구분">
        {(Object.keys(TAX_TYPE_LABELS) as TaxType[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.taxRow}
            onPress={() => updateSettings({ defaultTaxType: key })}
          >
            <Text style={styles.taxLabel}>{TAX_TYPE_LABELS[key]}</Text>
            {settings.defaultTaxType === key && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="백업">
        <TouchableOpacity style={styles.backupButton} onPress={handleExport} disabled={busy}>
          <Text style={styles.backupButtonText}>JSON으로 내보내기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backupButton} onPress={handleImport} disabled={busy}>
          <Text style={styles.backupButtonText}>JSON에서 가져오기</Text>
        </TouchableOpacity>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.text,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
  },
  backupButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backupButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
