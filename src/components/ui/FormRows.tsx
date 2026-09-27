import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { parseISODate } from '../../lib/calc';
import { formatDateFull } from '../../lib/format';
import { colors, spacing } from '../../theme';
import { Chip } from './Controls';
import { Chevron } from './Grouped';

/** 누르면 선택지가 행 안에서 펼쳐지는 행 (iOS 설정 앱의 인라인 선택처럼). */
export function PickerRow<T extends string | number>({
  title,
  options,
  value,
  onChange,
  open,
  onToggle,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <View>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onToggle}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.detail, open && styles.detailOpen]}>{current?.label}</Text>
        <Chevron direction={open ? 'up' : 'down'} />
      </Pressable>
      {open && (
        <View style={styles.options}>
          {options.map((o) => (
            <Chip
              key={String(o.value)}
              label={o.label}
              selected={o.value === value}
              onPress={() => {
                onChange(o.value);
                onToggle();
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** 제목 왼쪽, 입력값 오른쪽 정렬의 폼 행. */
export function InputRow({
  title,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  highlighted = false,
  onFocus,
}: {
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  suffix?: string;
  highlighted?: boolean;
  onFocus?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={[styles.input, highlighted && styles.inputHighlighted]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        textAlign="right"
        onFocus={onFocus}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

function toDate(iso: string): Date {
  const { y, m, d } = parseISODate(iso);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 날짜 행. iOS는 컴팩트 날짜 선택기를 행 오른쪽에 두고, Android는 눌러서 연다. */
export function DateRow({ title, value, onChange }: { title: string; value: string; onChange: (iso: string) => void }) {
  const [androidOpen, setAndroidOpen] = useState(false);
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display="compact"
          locale="ko-KR"
          onChange={(_e, date) => date && onChange(toISO(date))}
        />
      </View>
    );
  }
  return (
    <>
      <Pressable style={styles.row} onPress={() => setAndroidOpen(true)}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{formatDateFull(value)}</Text>
      </Pressable>
      {androidOpen && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          onChange={(_e, date) => {
            setAndroidOpen(false);
            if (date) onChange(toISO(date));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    gap: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  pressed: {
    backgroundColor: colors.barEmpty,
  },
  title: {
    fontSize: 17,
    color: colors.text,
    flexShrink: 0,
  },
  detail: {
    flex: 1,
    textAlign: 'right',
    fontSize: 17,
    color: colors.textMuted,
  },
  detailOpen: {
    color: colors.primary,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.textMuted,
    paddingVertical: 6,
  },
  inputHighlighted: {
    color: colors.primary,
    fontWeight: '600',
  },
  suffix: {
    fontSize: 17,
    color: colors.textMuted,
  },
});
