import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { compareISODates, daysInMonth, parseISODate, toISODate, type ISODate } from '../lib/calc';
import { colors, spacing } from '../theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 한 달짜리 달력 (Android용). Android에는 화면 안에 넣는 시스템 달력이 없어서, iOS의 인라인 달력처럼
 * 한 달을 펼쳐 놓고 날짜를 누르면 바로 고른다. min~max 밖의 날은 흐리게 두고 누를 수 없다.
 */
export function MonthCalendar({
  month,
  value,
  min,
  max,
  onChange,
}: {
  /** 보여 줄 달의 아무 날 (YYYY-MM-DD) */
  month: ISODate;
  value: ISODate;
  min: ISODate;
  max: ISODate;
  onChange: (date: ISODate) => void;
}) {
  const { y, m } = parseISODate(month);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const days = daysInMonth(y, m);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.calendar}>
      <Text style={styles.title}>
        {y}년 {m}월
      </Text>
      <View style={styles.week}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={`e${i}`} style={styles.cell} />;
          const iso = toISODate(y, m, d);
          const disabled = compareISODates(iso, min) < 0 || compareISODates(iso, max) > 0;
          const selected = iso === value;
          return (
            <Pressable
              key={iso}
              style={styles.cell}
              disabled={disabled}
              onPress={() => onChange(iso)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`${m}월 ${d}일`}
            >
              <View style={[styles.day, selected && styles.daySelected]}>
                <Text
                  style={[styles.dayText, disabled && styles.dayDisabled, selected && styles.dayTextSelected]}
                  maxFontSizeMultiplier={1.4}
                >
                  {d}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 18,
    color: colors.text,
  },
  dayDisabled: {
    color: colors.textFaint,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
