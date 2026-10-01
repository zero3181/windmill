import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../theme';

const CONTROL_HEIGHT = 50;

/** iOS 네이티브 세그먼트 컨트롤. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <SegmentedControl
      values={options.map((o) => o.label)}
      selectedIndex={Math.max(0, options.findIndex((o) => o.value === value))}
      onChange={(e) => onChange(options[e.nativeEvent.selectedSegmentIndex].value)}
      style={styles.segmented}
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

/**
 * 버튼 규칙: 화면의 큰 주 행동은 PrimaryButton, 줄 안의 주 행동은 PillButton,
 * 보조 행동은 LinkButton(파란 글자). 같은 무게의 행동은 같은 모양으로 쓴다.
 */
export function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pill, pressed && styles.buttonPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.link} onPress={onPress} hitSlop={8} accessibilityRole="button">
      {({ pressed }) => <Text style={[styles.linkText, pressed && styles.linkPressed]}>{label}</Text>}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 글자 앞에 붙는 작은 그림 (예: 은행 표시) */
  icon?: React.ReactNode;
}) {
  return (
    <Pressable style={[styles.chip, icon ? styles.chipWithIcon : null, selected && styles.chipSelected]} onPress={onPress}>
      {icon}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 컨트롤 높이는 50으로 통일한다 (세그먼트·버튼).
  segmented: {
    height: CONTROL_HEIGHT,
  },
  button: {
    height: CONTROL_HEIGHT,
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
  pill: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  link: {
    minHeight: 36,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 15,
    color: colors.primary,
  },
  linkPressed: {
    opacity: 0.5,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.barEmpty,
  },
  chipWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
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
