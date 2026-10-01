/**
 * 홈에 띄우는 짧은 피드백. 가입을 기록하면 맨 위로 스크롤해 날개가 자라는 모습과 안내·진동을,
 * 해지·삭제를 하면 '되돌리기'가 붙은 안내를 보여 준다.
 */
export interface Feedback {
  message: string;
  /** 있으면 안내에 '되돌리기' 버튼을 붙인다 */
  undo?: () => void | Promise<void>;
  /** 풍차가 처음 완성된 순간: 강한 진동으로 축하한다 */
  celebrate?: boolean;
}

type Listener = (feedback: Feedback) => void;

let listener: Listener | null = null;

export function onSavedFeedback(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function notifySaved(message: string): void {
  listener?.({ message });
}

/** 마지막 날개를 채워 풍차가 처음 돌기 시작하는 순간을 알린다. */
export function notifyCelebrate(message: string): void {
  listener?.({ message, celebrate: true });
}

/** 해지·삭제처럼 되돌릴 수 있는 일을 한 뒤 홈에 '되돌리기'와 함께 알린다. */
export function notifyUndoable(message: string, undo: () => void | Promise<void>): void {
  listener?.({ message, undo });
}

/**
 * 성공 진동. strong이면 축하용으로 두 번 세게 울린다.
 * 진동 모듈이 없는 개발용 빌드에서도 앱이 멈추지 않게 조용히 넘어간다.
 */
export function successHaptic(strong = false): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as typeof import('expo-haptics');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (strong) {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined), 350);
    }
  } catch {
    // 진동을 지원하지 않으면 건너뛴다.
  }
}
