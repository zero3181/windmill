import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui/Controls';
import { addDays, addMonthsClamped, compareISODates, parseISODate, todayKST } from '../lib/calc';
import { formatDateShort } from '../lib/format';
import { ensureNotificationSetup } from '../lib/notifications';
import { useAccounts } from '../store/AccountsContext';
import { colors, spacing } from '../theme';
import type { AccountType } from '../types/account';

const UNIT: Record<AccountType, string> = { savings: '적금', deposit: '예금' };

function toDate(iso: string): Date {
  const { y, m, d } = parseISODate(iso);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 그달 첫 평일 (은행이 여는 날). 오늘보다 이르면 오늘부터 찾는다. */
function firstOpenDay(from: string): string {
  let date = from;
  while ([0, 6].includes(toDate(date).getDay())) date = addDays(date, 1);
  return date;
}

/**
 * 할 일의 다음 가입 알림 날짜를 고른다. 가입할 달(month) 안에서만 고를 수 있고,
 * 고른 날 은행 여는 시간(오전 9시)에 알린다.
 */
export default function StepReminderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: AccountType; month: string; step: string }>();
  const type: AccountType = params.type === 'deposit' ? 'deposit' : 'savings';
  const { settings, updateSettings } = useAccounts();

  const today = todayKST();
  const monthStart = params.month;
  const monthEnd = addDays(addMonthsClamped(monthStart, 1), -1);
  const earliest = compareISODates(today, monthStart) > 0 ? today : monthStart;
  const saved = settings.stepReminder[type];
  const savedInRange = saved && compareISODates(saved, earliest) >= 0 && compareISODates(saved, monthEnd) <= 0;
  const firstOpen = firstOpenDay(earliest);
  const [date, setDate] = useState(
    savedInRange ? saved : compareISODates(firstOpen, monthEnd) <= 0 ? firstOpen : earliest
  );

  const { m } = parseISODate(monthStart);
  const label = `${m}월 ${params.step}번째 ${UNIT[type]} 가입`;

  async function handleSave() {
    if (!(await ensureNotificationSetup(true).catch(() => false))) {
      Alert.alert('알림이 꺼져 있어요', '설정 앱의 풍차돌리기 > 알림에서 허용해 주세요.');
      return;
    }
    await updateSettings({ stepReminder: { ...settings.stepReminder, [type]: date } });
    router.back();
  }

  async function handleOff() {
    await updateSettings({ stepReminder: { ...settings.stepReminder, [type]: undefined } });
    router.back();
  }

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>닫기</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <DateTimePicker
          value={toDate(date)}
          mode="date"
          display="inline"
          locale="ko-KR"
          minimumDate={toDate(today)}
          onChange={(_e, picked) => picked && setDate(toISO(picked))}
          accentColor={colors.primary}
        />
        <Text style={styles.when}>{formatDateShort(date)} 9시</Text>
        <View style={styles.actions}>
          <PrimaryButton label="알림 받기" onPress={handleSave} />
          {saved ? <PrimaryButton label="알림 끄기" variant="plain" onPress={handleOff} /> : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  when: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
});
