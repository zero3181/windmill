import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useDarkMode } from '../theme';
import type { AccountType } from '../types/account';

/**
 * 풍차 뒤 하늘. 적금 풍차는 날개의 민트·파랑에 맞춘 맑은 하늘, 예금 풍차는 노랑·주황·코랄에 맞춘 석양.
 * 위에서 아래로 옅어져 홈 바탕색으로 이어진다. 어두운 화면에서는 같은 색을 밤하늘처럼 낮춘다.
 */
/** [위치(0~1), 색] 목록. 마지막 색은 홈 바탕색이라 시트와 자연스럽게 이어진다. */
type Stops = [number, string][];

const SKY: Record<'light' | 'dark', Record<AccountType, Stops>> = {
  light: {
    // 맑은 하늘: 위는 짙은 하늘색, 풍차 아래로 갈수록 옅은 하늘
    savings: [
      [0, '#8CCBFF'],
      [0.5, '#BFE2FF'],
      [0.85, '#E3F1FF'],
      [1, '#F2F2F7'],
    ],
    // 석양: 위는 주황, 가운데 살구·분홍, 아래로 옅어진다
    deposit: [
      [0, '#FFA67A'],
      [0.45, '#FFC6AE'],
      [0.8, '#FCE3DA'],
      [1, '#F2F2F7'],
    ],
  },
  dark: {
    savings: [
      [0, '#123A66'],
      [0.6, '#0A1D36'],
      [1, '#000000'],
    ],
    deposit: [
      [0, '#5C2416'],
      [0.6, '#2A0F0B'],
      [1, '#000000'],
    ],
  },
};

export function HeroSky({ type, height }: { type: AccountType; height: number }) {
  const mode = useDarkMode() ? 'dark' : 'light';
  // 적금/예금을 바꾸면 하늘이 서서히 바뀐다 (석양 층의 불투명도 0 ↔ 1)
  const [sunset] = useState(() => new Animated.Value(type === 'deposit' ? 1 : 0));
  useEffect(() => {
    Animated.timing(sunset, { toValue: type === 'deposit' ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [type, sunset]);

  return (
    <View pointerEvents="none" style={[styles.sky, { height }]}>
      <Gradient id="sky-savings" colors={SKY[mode].savings} height={height} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sunset }]}>
        <Gradient id="sky-deposit" colors={SKY[mode].deposit} height={height} />
      </Animated.View>
    </View>
  );
}

function Gradient({ id, colors, height }: { id: string; colors: Stops; height: number }) {
  return (
    // 높이가 바뀌면(풍차 높이를 잰 뒤) 새로 그린다: 그라데이션이 처음 크기에 머무르지 않게
    <Svg key={height} width="100%" height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {colors.map(([offset, color]) => (
            <Stop key={offset} offset={offset} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
