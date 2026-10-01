import { Stack } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../../theme';

interface Action {
  label: string;
  onPress: () => void;
  /** 주 행동(완료·저장): iOS는 강조 버튼, Android는 굵은 글자 */
  done?: boolean;
  disabled?: boolean;
  /** 투명 제목줄 위에 떠 있는 버튼: 아래 내용과 겹쳐도 읽히게 둥근 바탕을 깐다 */
  floating?: boolean;
}

/**
 * 제목줄 왼쪽·오른쪽 버튼. iOS는 네이티브 툴바를 쓰고, Android는 제목줄에 글자 버튼을 단다
 * (Android 시트·투명 제목줄에는 툴바가 그려지지 않는다). Android의 취소·닫기는 시스템 뒤로 가기와
 * 제목줄 뒤로 화살표가 대신하므로 왼쪽 버튼은 iOS에서만 단다.
 */
export function HeaderActions({ left, right }: { left?: Action; right?: Action }) {
  if (Platform.OS === 'ios') {
    return (
      <>
        {left && (
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button disabled={left.disabled} onPress={left.onPress}>
              {left.label}
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        )}
        {right && (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button variant={right.done ? 'done' : undefined} disabled={right.disabled} onPress={right.onPress}>
              {right.label}
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        )}
      </>
    );
  }
  if (!right) return null;
  return <Stack.Screen options={{ headerRight: () => <HeaderTextButton {...right} /> }} />;
}

export function HeaderTextButton({ label, onPress, done, disabled, floating }: Action) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      style={({ pressed }) => [styles.button, floating && styles.floating, (pressed || disabled) && styles.dim]}
      accessibilityRole="button"
    >
      <Text style={[styles.label, done && styles.done]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  floating: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.card,
    elevation: 3,
  },
  dim: {
    opacity: 0.4,
  },
  label: {
    fontSize: 17,
    color: colors.primary,
  },
  done: {
    fontWeight: '700',
  },
});
