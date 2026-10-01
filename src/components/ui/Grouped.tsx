import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** iOS inset grouped 리스트 섹션: 제목 + 흰 카드 + 행 사이 구분선 + 설명. */
export function GroupedSection({
  title,
  footer,
  bare = false,
  children,
}: {
  title?: string;
  footer?: string;
  /** 세그먼트 컨트롤 하나처럼 스스로 모양을 가진 내용은 흰 카드로 감싸지 않는다. */
  bare?: boolean;
  children: React.ReactNode;
}) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {bare ? (
        children
      ) : (
        <View style={styles.card}>
          {rows.map((row, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.separator} />}
              {row}
            </React.Fragment>
          ))}
        </View>
      )}
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

export type RowTint = 'default' | 'primary' | 'destructive';

/** iOS 리스트 행. tint가 primary/destructive면 버튼 행으로 동작한다. */
export function ListRow({
  title,
  subtitle,
  detail,
  detailStyle,
  chevron = false,
  tint = 'default',
  right,
  onPress,
  onLongPress,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  detail?: string;
  detailStyle?: StyleProp<TextStyle>;
  chevron?: boolean;
  tint?: RowTint;
  right?: React.ReactNode;
  onPress?: () => void;
  /** 길게 누르면 (메뉴 등) */
  onLongPress?: () => void;
  /** 흐리게 보이고 누를 수 없다 */
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        subtitle ? styles.rowTall : null,
        pressed && onPress ? styles.rowPressed : null,
        disabled && styles.rowDisabled,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled || (!onPress && !onLongPress)}
      accessibilityState={{ disabled }}
    >
      <View style={styles.rowMain}>
        <Text
          style={[styles.rowTitle, tint === 'primary' && styles.tintPrimary, tint === 'destructive' && styles.tintDestructive]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {detail ? (
        <Text style={[styles.rowDetail, detailStyle]} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      {right}
      {chevron && <Chevron />}
    </Pressable>
  );
}

export function Chevron({ direction = 'right' }: { direction?: 'right' | 'down' | 'up' }) {
  return (
    <SymbolView
      name={direction === 'right' ? 'chevron.right' : direction === 'down' ? 'chevron.down' : 'chevron.up'}
      size={13}
      weight="semibold"
      tintColor={colors.textFaint}
      style={styles.chevron}
      fallback={<Text style={styles.chevronFallback}>›</Text>}
    />
  );
}

/** 섹션 카드 모양만 필요한 곳(요약 카드 등)에 쓰는 흰 카드. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, styles.cardPadded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardPadded: {
    padding: spacing.xl - 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    gap: spacing.sm,
  },
  rowTall: {
    minHeight: 64,
    paddingVertical: 10,
  },
  rowDisabled: {
    opacity: 0.35,
  },
  rowPressed: {
    backgroundColor: colors.barEmpty,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    color: colors.text,
  },
  tintPrimary: {
    color: colors.primary,
  },
  tintDestructive: {
    color: colors.danger,
  },
  rowSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowDetail: {
    fontSize: 17,
    color: colors.textMuted,
    flexShrink: 0,
  },
  chevron: {
    width: 10,
    height: 16,
  },
  chevronFallback: {
    fontSize: 20,
    color: colors.textFaint,
  },
});
