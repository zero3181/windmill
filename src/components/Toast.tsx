import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../theme';

/**
 * 화면 아래쪽에 잠깐 떴다가 사라지는 한 줄 안내. id가 바뀔 때마다 다시 뜬다.
 * action이 있으면 오른쪽에 버튼(예: 되돌리기)을 붙이고 조금 더 오래 보여 준다.
 */
export function Toast({
  message,
  id,
  actionLabel,
  onAction,
}: {
  message: string | null;
  id: number;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  // 다 사라졌거나 버튼을 누른 안내의 id. 새 id가 오면 다시 보인다.
  const [hiddenId, setHiddenId] = useState(-1);
  const visible = hiddenId !== id;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(actionLabel ? 4000 : 2200),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && setHiddenId(id));
    return () => anim.stop();
  }, [id, message, actionLabel, opacity]);

  if (!message || !visible) return null;
  return (
    <Animated.View
      pointerEvents={actionLabel ? 'box-none' : 'none'}
      style={[styles.toast, { bottom: insets.bottom + spacing.lg, opacity }]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            setHiddenId(id);
            onAction();
          }}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  action: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64B5FF',
  },
});
