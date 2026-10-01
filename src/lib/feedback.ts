/**
 * 가입을 기록한 뒤 홈에 보여 줄 짧은 피드백. 가입 시트에서 알리고, 홈이 받아
 * 맨 위로 스크롤해 날개가 자라는 모습을 보여 주고 안내와 진동을 낸다.
 */
type Listener = (message: string) => void;

let listener: Listener | null = null;

export function onSavedFeedback(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function notifySaved(message: string): void {
  listener?.(message);
}

/** 성공 진동. 진동 모듈이 없는 개발용 빌드에서도 앱이 멈추지 않게 조용히 넘어간다. */
export function successHaptic(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as typeof import('expo-haptics');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  } catch {
    // 진동을 지원하지 않으면 건너뛴다.
  }
}
