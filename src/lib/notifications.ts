import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Account } from '../types/account';
import { addDays, compareISODates, parseISODate, todayKST } from './calc';
import { formatWon } from './format';
import type { AppSettings } from './settings';

const CHANNEL_ID = 'pungcha-default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '풍차 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return granted;
}

function dateAt9am(iso: string): Date {
  const { y, m, d } = parseISODate(iso);
  return new Date(y, m - 1, d, 9, 0, 0);
}

/**
 * 모든 예약 알림을 취소하고, 현재 진행 중인 계좌와 설정을 기준으로 다시 등록한다.
 * 앱 재설치/백업 복원/계좌 변경 시마다 호출해 알림 상태를 항상 최신으로 유지한다.
 */
export async function rescheduleAllNotifications(
  accounts: Account[],
  settings: AppSettings
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await ensureNotificationSetup();
  if (!granted) return;

  const today = todayKST();
  const active = accounts.filter((a) => a.status === 'active');
  const androidChannel = Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {};

  for (const account of active) {
    if (settings.notifyD7) {
      const d7Date = addDays(account.maturityDate, -7);
      if (compareISODates(d7Date, today) >= 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `[D-7] ${account.name} 만기가 다가와요`,
            body: `${account.bank} · 7일 후 만기예요`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dateAt9am(d7Date),
            ...androidChannel,
          },
        });
      }
    }

    if (settings.notifyDday) {
      if (compareISODates(account.maturityDate, today) >= 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `[만기일] ${account.name}`,
            body: `${account.bank} · 오늘이 만기예요. 만기 처리를 진행해보세요.`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dateAt9am(account.maturityDate),
            ...androidChannel,
          },
        });
      }
    }

    if (
      account.type === 'savings' &&
      settings.notifyPayday &&
      compareISODates(account.maturityDate, today) > 0
    ) {
      const day = account.payDay ?? parseISODate(account.startDate).d;
      const content = {
        title: '적금 납입일이에요',
        body: `${account.name} · ${account.bank} · ${formatWon(account.amount)} 납입일이에요`,
      };
      if (Platform.OS === 'ios') {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            day,
            hour: 9,
            minute: 0,
            repeats: true,
          },
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day,
            hour: 9,
            minute: 0,
            channelId: CHANNEL_ID,
          },
        });
      }
    }
  }
}
