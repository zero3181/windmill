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
  placeholder,
}: {
  title: string;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  open: boolean;
  onToggle: () => void;
  /** 아직 고르지 않았을 때 보일 글자 */
  placeholder?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <View>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onToggle}>
        <Text style={styles.title}>{title}</Text>
        {current?.icon}
        <Text style={[styles.detail, open && styles.detailOpen, !current && styles.detailPlaceholder]}>
          {current?.label ?? placeholder}
        </Text>
        <Chevron direction={open ? 'up' : 'down'} />
      </Pressable>
      {open && (
        <View style={styles.options}>
          {options.map((o) => (
            <Chip
              key={String(o.value)}
              label={o.label}
              icon={o.icon}
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

/** 제목 왼쪽, 입력값 오른쪽 정렬의 폼 행. 제목이 없으면 입력값만 행 전체에 둔다. */
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
  title?: string;
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
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <TextInput
        style={[styles.input, !title && styles.inputBare, highlighted && styles.inputHighlighted]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        textAlign={title ? 'right' : 'left'}
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
  // iOS 컴팩트 선택기는 날짜를 골라도 달력이 떠 있어서, 고르면 선택기를 새로 그려 달력을 닫는다.
  const [pickerKey, setPickerKey] = useState(0);
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        <DateTimePicker
          key={pickerKey}
          value={toDate(value)}
          mode="date"
          display="compact"
          locale="ko-KR"
          onChange={(e, date) => {
            if (!date) return;
            onChange(toISO(date));
            if (e.type === 'set') setPickerKey((k) => k + 1);
          }}
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
  detailPlaceholder: {
    color: colors.textFaint,
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
  inputBare: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
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
