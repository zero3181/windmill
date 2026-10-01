import React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { canonicalBank } from '../lib/banks';

/** 은행 로고 (Figma 보드의 은행 CI에서 받아 3배 해상도로 넣었다). 저축은행은 공용 저축은행 로고를 쓴다. */
const LOGOS: Record<string, ImageSourcePropType> = {
  KB국민은행: require('../../assets/banks/kb.png'),
  신한은행: require('../../assets/banks/shinhan.png'),
  하나은행: require('../../assets/banks/hana.png'),
  우리은행: require('../../assets/banks/woori.png'),
  NH농협은행: require('../../assets/banks/nh.png'),
  IBK기업은행: require('../../assets/banks/ibk.png'),
  SC제일은행: require('../../assets/banks/sc.png'),
  한국씨티은행: require('../../assets/banks/citi.png'),
  KDB산업은행: require('../../assets/banks/kdb.png'),
  카카오뱅크: require('../../assets/banks/kakao.png'),
  토스뱅크: require('../../assets/banks/toss.png'),
  케이뱅크: require('../../assets/banks/kbank.png'),
  iM뱅크: require('../../assets/banks/im.png'),
  부산은행: require('../../assets/banks/busan.png'),
  경남은행: require('../../assets/banks/kyongnam.png'),
  광주은행: require('../../assets/banks/kwangju.png'),
  전북은행: require('../../assets/banks/jeonbuk.png'),
  제주은행: require('../../assets/banks/jeju.png'),
  수협은행: require('../../assets/banks/suhyup.png'),
  우체국: require('../../assets/banks/post.png'),
  새마을금고: require('../../assets/banks/mg.png'),
  신협: require('../../assets/banks/cu.png'),
};
const SAVINGS_BANK_LOGO: ImageSourcePropType = require('../../assets/banks/savings.png');

function logoFor(bank: string): ImageSourcePropType | undefined {
  const name = canonicalBank(bank);
  return LOGOS[name] ?? (name.endsWith('저축은행') ? SAVINGS_BANK_LOGO : undefined);
}

export function BankBadge({ bank, size = 20 }: { bank: string; size?: number }) {
  const logo = logoFor(bank);
  if (logo) {
    return <Image source={logo} style={{ width: size, height: size }} accessible={false} />;
  }
  // 로고가 없는 은행(직접 입력한 이름 등)은 첫 글자 동그라미로 보여 준다.
  const mark = bank.trim()[0] || '?';
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]} accessible={false}>
      <Text style={[styles.mark, { fontSize: size * 0.55 }]} numberOfLines={1} allowFontScaling={false}>
        {mark}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E8E93',
  },
  mark: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
