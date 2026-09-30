import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** iOS 네이티브 세그먼트 컨트롤. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'regular',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** large: 홈의 적금/예금 풍차 전환처럼 화면을 나누는 큰 전환 (높이 44) */
  size?: 'regular' | 'large';
}) {
  return (
    <SegmentedControl
      values={options.map((o) => o.label)}
      selectedIndex={Math.max(0, options.findIndex((o) => o.value === value))}
      onChange={(e) => onChange(options[e.nativeEvent.selectedSegmentIndex].value)}
      style={[styles.segmented, size === 'large' && styles.segmentedLarge]}
    />
  );
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'prominent',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'prominent' | 'plain';
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'plain' && styles.buttonPlain,
        (pressed || disabled) && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, variant === 'plain' && styles.buttonTextPlain]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmented: {
    height: 36,
  },
  segmentedLarge: {
    height: 44,
  },
  button: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonPlain: {
    backgroundColor: colors.primarySoft,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextPlain: {
    color: colors.primary,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.barEmpty,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.primary,
  },
});
