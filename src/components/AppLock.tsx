import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { LOCK_METHOD_LABEL, unlockApp } from '../lib/appLock';
import { useAccounts } from '../store/AccountsContext';
import { colors, spacing } from '../theme';
import { PrimaryButton } from './ui/Controls';
import { Windmill } from './Windmill';

/**
 * 설정에서 잠금을 켜 두면 앱을 열 때와 백그라운드에서 돌아올 때 화면을 가리고 생체 인증을 묻는다.
 * 인증을 취소하면 가린 채로 두고 '잠금 해제' 버튼으로 다시 시도한다.
 */
export function AppLockGate() {
  const { settings, loading } = useAccounts();
  // 설정을 읽은 뒤에 붙여, 앱을 열 때의 잠금 여부를 처음 값으로 정한다.
  return loading ? null : <LockCover enabled={settings.appLock} />;
}

function LockCover({ enabled }: { enabled: boolean }) {
  // 앱을 열 때 잠금이 켜져 있었으면 잠긴 채로 시작한다. 설정에서 막 켠 경우에는 다음에 돌아올 때부터 잠근다.
  const [locked, setLocked] = useState(enabled);
  const authenticating = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    const ok = await unlockApp();
    authenticating.current = false;
    if (ok) setLocked(false);
  }, []);

  // 앱을 처음 열 때 (잠겨 있으면) 바로 묻는다.
  const askedAtLaunch = useRef(false);
  useEffect(() => {
    if (askedAtLaunch.current || !locked) return;
    askedAtLaunch.current = true;
    void tryUnlock();
  }, [locked, tryUnlock]);

  // 백그라운드로 가면 잠그고, 돌아오면 다시 묻는다. 인증 창이 뜨는 동안의 inactive는 무시한다.
  useEffect(() => {
    if (!enabled) return;
    let wentBackground = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wentBackground = true;
        setLocked(true);
      } else if (state === 'active' && wentBackground) {
        wentBackground = false;
        void tryUnlock();
      }
    });
    return () => sub.remove();
  }, [enabled, tryUnlock]);

  if (!enabled || !locked) return null;
  return (
    <View style={styles.cover} accessibilityViewIsModal>
      <Windmill blades={12} filled={[]} width={160} />
      <Text style={styles.title}>풍차돌리기가 잠겨 있어요</Text>
      <PrimaryButton label={`${LOCK_METHOD_LABEL}로 잠금 해제`} onPress={() => void tryUnlock()} />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});
