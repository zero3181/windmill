import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
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

/**
 * 알림 권한을 이유와 함께 묻는다. iOS 권한 창은 한 번 '허용 안 함'을 누르면 다시 띄울 수 없어서,
 * 먼저 앱의 확인 창으로 왜 필요한지 보여 주고 '알림 받기'를 누른 사람에게만 권한 창을 띄운다.
 * - granted: 허용됨 / later: '나중에'(다음에 다시 물을 수 있음) / denied: 시스템에서 꺼져 있음
 */
export async function askNotificationPermission(reason: string): Promise<'granted' | 'later' | 'denied'> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return 'granted';
  if (!existing.canAskAgain) return 'denied';
  const yes = await new Promise<boolean>((resolve) =>
    Alert.alert('알림을 받을까요?', reason, [
      { text: '나중에', style: 'cancel', onPress: () => resolve(false) },
      { text: '알림 받기', onPress: () => resolve(true) },
    ])
  );
  if (!yes) return 'later';
  return (await ensureNotificationSetup(true)) ? 'granted' : 'denied';
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

  // 할 일 목록: 사용자가 고른 날 은행 여는 시간(오전 9시)에 다음 가입을 알린다.
  for (const type of ['savings', 'deposit'] as const) {
    const goal = settings.goals[type];
    const remindOn = settings.stepReminder[type];
    if (!goal || !remindOn || compareISODates(remindOn, today) < 0) continue;
    const next = buildChecklist(goal, type, accounts, today).steps.find((s) => s.status === 'scheduled');
    if (!next) continue;
    const unit = type === 'savings' ? '적금' : '예금';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${next.index + 1}번째 ${unit}을 가입할 차례예요`,
        body: `이번 달에 ${unit}을 가입하면 날개 하나가 채워져요.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dateAt9am(remindOn),
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
            body: '해지하면 앱에서 만기 해지를 눌러 주세요.',
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
            body: '해지하면 앱에서 만기 해지를 눌러 주세요.',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dateAt9am(account.maturityDate),
            ...androidChannel,
          },
        });
      }
    }
  }

  // 적금 납입일: 같은 날 납입하는 적금을 한 통으로 묶어 매달 알린다 (계좌마다 따로 오면 너무 많다).
  if (settings.notifyPayday) {
    const byDay = new Map<number, Account[]>();
    for (const account of active) {
      if (account.type !== 'savings' || compareISODates(account.maturityDate, today) <= 0) continue;
      const day = account.payDay ?? parseISODate(account.startDate).d;
      byDay.set(day, [...(byDay.get(day) ?? []), account]);
    }
    for (const [day, list] of byDay) {
      const total = list.reduce((sum, a) => sum + a.amount, 0);
      const content = {
        title: '오늘은 적금 납입일이에요',
        body: list.length === 1 ? `${list[0].name} · ${formatManwon(total)}` : `적금 ${list.length}건 · ${formatManwon(total)}`,
      };
      await Notifications.scheduleNotificationAsync({
        content,
        trigger:
          Platform.OS === 'ios'
            ? { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, day, hour: 9, minute: 0, repeats: true }
            : { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day, hour: 9, minute: 0, channelId: CHANNEL_ID },
      });
    }
  }
}
