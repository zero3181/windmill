import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function EmptyState() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🏦</Text>
      <Text style={styles.title}>풍차돌리기를 시작해보세요</Text>
      <Text style={styles.desc}>
        매달 새 예·적금을 하나씩 가입해 매달 만기가 돌아오게 만드는 저축 방식이에요.{'\n'}
        아래는 예시 화면이에요 — 계좌를 등록하면 진짜 데이터로 바뀌어요.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/account/new')}>
        <Text style={styles.buttonText}>첫 계좌 추가</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  desc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
