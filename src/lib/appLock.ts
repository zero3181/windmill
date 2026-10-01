import { Platform } from 'react-native';

type LocalAuthentication = typeof import('expo-local-authentication');

/** 네이티브 모듈이 없는 빌드(예전 개발용 앱)에서도 앱이 죽지 않게 필요할 때 불러온다. */
function loadModule(): LocalAuthentication | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-local-authentication') as LocalAuthentication;
  } catch {
    return null;
  }
}

/** 설정·잠금 화면에 쓰는 이름 */
export const LOCK_METHOD_LABEL = Platform.OS === 'ios' ? 'Face ID' : '생체 인증';

/** 이 기기에서 생체 인증을 쓸 수 있는지 (센서가 있고 등록돼 있어야 한다) */
export async function canUseAppLock(): Promise<boolean> {
  const auth = loadModule();
  if (!auth) return false;
  try {
    const [hardware, enrolled] = await Promise.all([auth.hasHardwareAsync(), auth.isEnrolledAsync()]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/** 생체 인증을 요청한다. 여러 번 실패하면 기기 암호로 풀 수 있다. */
export async function unlockApp(): Promise<boolean> {
  const auth = loadModule();
  if (!auth) return true;
  try {
    const result = await auth.authenticateAsync({ promptMessage: '풍차돌리기 잠금 해제', cancelLabel: '취소' });
    return result.success;
  } catch {
    return false;
  }
}
