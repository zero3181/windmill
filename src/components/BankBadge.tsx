import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * 은행 표시: 대표색 동그라미에 약칭. 공식 로고 이미지는 상표라 앱에 넣지 않고,
 * 목록에서 은행을 빨리 알아볼 수 있을 만큼만 색과 글자로 나타낸다.
 */
const MARKS: Record<string, { mark: string; bg: string; fg?: string }> = {
  KB국민은행: { mark: 'KB', bg: '#FFBC00', fg: '#3C3C3C' },
  신한은행: { mark: '신한', bg: '#0046FF' },
  하나은행: { mark: '하나', bg: '#009490' },
  우리은행: { mark: '우리', bg: '#0067AC' },
  NH농협은행: { mark: 'NH', bg: '#1EA54B' },
  IBK기업은행: { mark: 'IBK', bg: '#0B5BA9' },
  SC제일은행: { mark: 'SC', bg: '#0072AA' },
  카카오뱅크: { mark: 'K', bg: '#FFE300', fg: '#3C1E1E' },
  토스뱅크: { mark: 'T', bg: '#0064FF' },
  케이뱅크: { mark: 'K', bg: '#3D2FD0' },
  iM뱅크: { mark: 'iM', bg: '#00A0E2' },
  부산은행: { mark: 'BNK', bg: '#E60012' },
  경남은행: { mark: 'BNK', bg: '#E60012' },
  광주은행: { mark: 'JB', bg: '#0050A0' },
  전북은행: { mark: 'JB', bg: '#0050A0' },
  제주은행: { mark: '제주', bg: '#0072BC' },
  수협은행: { mark: 'Sh', bg: '#0A64AC' },
  우체국: { mark: '우', bg: '#E60012' },
  새마을금고: { mark: 'MG', bg: '#00508F' },
  신협: { mark: 'CU', bg: '#0066B3' },
  SBI저축은행: { mark: 'SBI', bg: '#0071BC' },
  OK저축은행: { mark: 'OK', bg: '#F05A28' },
  웰컴저축은행: { mark: 'W', bg: '#FF6600' },
  페퍼저축은행: { mark: 'P', bg: '#E4002B' },
};

export function BankBadge({ bank, size = 20 }: { bank: string; size?: number }) {
  const known = MARKS[bank];
  const mark = known?.mark ?? (bank.trim()[0] || '?');
  // 글자 수에 맞춰 줄여서 동그라미 안에 들어가게 한다.
  const fontSize = size * (mark.length >= 3 ? 0.34 : mark.length === 2 ? 0.42 : 0.55);
  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: known?.bg ?? '#8E8E93' }]}
      accessible={false}
    >
      <Text style={[styles.mark, { fontSize, color: known?.fg ?? '#FFFFFF' }]} numberOfLines={1} allowFontScaling={false}>
        {mark}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
