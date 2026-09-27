import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { PrimaryButton } from './ui/Controls';
import { Card } from './ui/Grouped';
import { Windmill } from './Windmill';

/** 아직 풍차도 계좌도 없을 때: 풍차 만들기로 시작한다. */
export function EmptyState() {
  const router = useRouter();
  return (
    <Card style={styles.card}>
      <View style={styles.art}>
        <Windmill blades={12} filled={0} width={200} />
      </View>
      <Text style={styles.title}>나만의 풍차를 만들어 보세요</Text>
      <Text style={styles.desc}>날개 수와 금액만 정하면{'\n'}매달 무엇을 가입하면 되는지 알려드려요.</Text>
      <View style={styles.actions}>
        <PrimaryButton label="풍차 만들기" onPress={() => router.push('/create-windmill')} />
        <PrimaryButton label="이미 가입한 계좌가 있어요" variant="plain" onPress={() => router.push('/add-account')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  art: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
