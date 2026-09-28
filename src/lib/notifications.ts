import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Account } from '../types/account';
import { addDays, compareISODates, parseISODate, todayKST } from './calc';
import { buildChecklist } from './checklist';
import { formatManwon } from './format';
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

/**
 * 알림 권한을 확인한다. request가 true일 때만 권한 창을 띄운다.
 * 권한은 계좌를 처음 등록하는 순간에 묻고, 앱 실행 중 재예약할 때는 묻지 않는다.
 */
export async function ensureNotificationSetup(request = false): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && request && existing.canAskAgain) {
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

  const active = accounts.filter((a) => a.status === 'active');
  if (active.length === 0) return;

  const granted = await ensureNotificationSetup();
  if (!granted) return;

  const today = todayKST();
  const androidChannel = Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {};

  // 할 일 목록: 다음 가입 달이 되면 그달 1일 오전 9시에 알린다.
  for (const type of ['savings', 'deposit'] as const) {
    const goal = settings.goals[type];
    if (!goal || !settings.stepReminder[type]) continue;
    const next = buildChecklist(goal, type, accounts, today).steps.find((s) => s.status === 'scheduled');
    if (!next) continue;
    const unit = type === 'savings' ? '적금' : '예금';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${next.index + 1}번째 ${unit}을 가입할 차례예요`,
        body: `이번 달에 ${unit}을 하나 가입하고 풍차 날개를 채워 보세요.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dateAt9am(next.month),
        ...androidChannel,
      },
    });
  }

  for (const account of active) {
    if (settings.notifyD7) {
      const d7Date = addDays(account.maturityDate, -7);
      if (compareISODates(d7Date, today) >= 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${account.name} 만기가 7일 남았어요`,
            body: '만기가 되면 다시 가입할지 해지할지 정해 주세요.',
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
            title: `오늘 ${account.name} 만기예요`,
            body: '다시 가입할지 해지할지 정해 주세요.',
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
        title: '오늘은 적금 납입일이에요',
        body: `${[account.name, account.bank].filter(Boolean).join(' · ')} · ${formatManwon(account.amount)}`,
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
