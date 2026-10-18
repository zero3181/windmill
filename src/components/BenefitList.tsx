import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

/** 풍차돌리기의 장점 세 가지 (소개와 '풍차돌리기란?' 안내가 같이 쓴다) */
const BENEFITS: { icon: SymbolViewProps['name']; title: string; body: string }[] = [
  {
    icon: { ios: 'calendar', android: 'calendar_month' },
    title: '매달 목돈이 돌아와요',
    body: '급하게 돈이 필요해도 전부 깨지 않고, 그달 만기분만 쓰면 돼요.',
  },
  {
    icon: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
    title: '금리 변화에 덜 흔들려요',
    body: '매달 그때 금리로 새로 가입하니, 금리가 오르면 바로 반영돼요.',
  },
  {
    icon: { ios: 'leaf', android: 'eco' },
    title: '저축이 습관이 돼요',
    body: '매달 하나씩 늘어나는 계좌를 보며 꾸준히 모을 수 있어요.',
  },
];

export function BenefitList({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.benefits, style]}>
      {BENEFITS.map((b) => (
        <View key={b.title} style={styles.benefit}>
          <View style={styles.benefitIcon}>
            <SymbolView
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              name={b.icon}
              size={22}
              tintColor={colors.primary}
              fallback={null}
            />
          </View>
          <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>{b.title}</Text>
            <Text style={styles.benefitBody}>{b.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  benefits: {
    alignSelf: 'stretch',
    gap: spacing.xl,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  benefitBody: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
