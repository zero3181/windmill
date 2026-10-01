import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { bladeMonth } from '../lib/blades';
import type { AccountType } from '../types/account';

const AnimatedG = Animated.createAnimatedComponent(G);

// 전체 그림은 240x188 좌표계에서 그리고, 날개만 허브를 중심으로 따로 돌린다.
const VIEW = 240;
const VIEW_H = 188;
const HUB = { x: 120, y: 84 };
const BLADE_LEN = 72;
const HUB_R = 10;
const BLADE_BOX = (BLADE_LEN + 4) * 2;

// 날개 색: 적금은 민트 → 블루 → 인디고(한색), 예금은 노랑 → 주황 → 코랄 → 핑크(난색)로 이어지는 iOS 액센트 그라데이션.
const SWEEPS: Record<AccountType, string[]> = {
  savings: ['#00C8B3', '#00C0E8', '#0088FF', '#6155F5'],
  deposit: ['#FFCC00', '#FF8D28', '#FF6B4A', '#FF2D55'],
};
/** 아직 채우지 않은 날개 자리 (Activity 링의 빈 트랙처럼). 뒤의 탑이 비치지 않게 불투명하게 쓴다. */
const EMPTY_FILL = '#E9E9EE';

interface Props {
  /** 날개 수 = 가입 기간(개월) */
  blades: number;
  /** 채워진 날개 자리 (bladePosition으로 구한 0~blades-1). 날개 하나가 만기월 하나를 뜻한다. */
  filled: number[];
  width: number;
  /** 적금(한색) / 예금(난색) 풍차 색 */
  type?: AccountType;
  /** 날개 끝에 각 날개가 뜻하는 달(1~12)을 보여 준다. 보이는 동안은 돌지 않는다. */
  showMonths?: boolean;
}

/**
 * 날개 하나가 달 하나를 뜻하는 풍차. 시계처럼 12시 방향이 12월, 1시 방향이 1월이다.
 * 계좌의 만기월 자리에 날개가 생기고, 모든 자리가 채워지면 돌아간다.
 */
export function Windmill({ blades, filled, width, type = 'savings', showMonths = false }: Props) {
  const filledSet = new Set(filled);
  const count = filledSet.size;
  const complete = count >= blades;
  const scale = width / VIEW;

  const [spin] = useState(() => new Animated.Value(0));
  const [wiggle] = useState(() => new Animated.Value(0));
  const [grow] = useState(() => new Animated.Value(1));
  const filledKey = [...filledSet].sort((a, b) => a - b).join(',');
  const prevFilled = useRef(filledSet);
  /** 방금 새로 채워진 날개 자리 (자라나는 애니메이션을 준다) */
  const [fresh, setFresh] = useState<Set<number>>(() => new Set());
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // 날개가 새로 생기면 허브에서 스프링으로 자라나고, 로터가 살짝 밀린다.
  useEffect(() => {
    const current = new Set(filledKey ? filledKey.split(',').map(Number) : []);
    const added = new Set([...current].filter((p) => !prevFilled.current.has(p)));
    prevFilled.current = current;
    if (added.size === 0 || reduceMotion) return;
    setFresh(added);
    grow.setValue(0.3);
    wiggle.setValue(-8);
    Animated.parallel([
      Animated.spring(grow, { toValue: 1, friction: 6, tension: 90, useNativeDriver: false }),
      Animated.spring(wiggle, { toValue: 0, friction: 4, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [filledKey, reduceMotion, grow, wiggle]);

  // 날개를 모두 채우면 천천히 계속 돈다.
  useEffect(() => {
    if (!complete || reduceMotion || showMonths) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [complete, reduceMotion, showMonths, spin]);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const wiggleDeg = wiggle.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] });

  // 12날개는 이웃 날개와 겹치지 않을 만큼만 넓힌다.
  const bladeWidth = blades <= 6 ? 33 : 18;
  const bladePath = blades <= 6 ? sailPath(bladeWidth, 13) : sailPath(bladeWidth, 8, 0.62);
  const box = BLADE_BOX * scale;

  return (
    <View
      style={{ width, height: width * (VIEW_H / VIEW) }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        complete
          ? `풍차 완성, 날개 ${blades}개`
          : `풍차 날개 ${blades}개 중 ${count}개 채움${count > 0 ? ` (${[...filledSet].sort((a, b) => a - b).map((p) => `${bladeMonth(p, blades)}월`).join(', ')})` : ''}`
      }
    >
      <Svg width={width} height={width * (VIEW_H / VIEW)} viewBox={`0 0 ${VIEW} ${VIEW_H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="tower" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#EDEDF2" />
            <Stop offset="0.55" stopColor="#E0E0E6" />
            <Stop offset="1" stopColor="#CFCFD6" />
          </LinearGradient>
        </Defs>
        {/* 바닥 그림자 */}
        <Ellipse cx={120} cy={181} rx={30} ry={3.5} fill="#000000" fillOpacity={0.06} />
        {/* 탑: 아래로 갈수록 부드럽게 넓어지는 짧은 기둥 */}
        <Path d="M105 180 Q106 119 115.4 91 Q120 84.5 124.6 91 Q134 119 135 180 Q120 184 105 180 Z" fill="url(#tower)" />
      </Svg>

      <Animated.View
        style={{
          position: 'absolute',
          left: (HUB.x - BLADE_BOX / 2) * scale,
          top: (HUB.y - BLADE_BOX / 2) * scale,
          width: box,
          height: box,
          transform: [{ rotate: spinDeg }, { rotate: wiggleDeg }],
        }}
      >
        <Svg width={box} height={box} viewBox={`${-BLADE_BOX / 2} ${-BLADE_BOX / 2} ${BLADE_BOX} ${BLADE_BOX}`}>
          {Array.from({ length: blades }, (_, i) => {
            const angle = (360 / blades) * i;
            if (!filledSet.has(i)) {
              return <Path key={i} d={bladePath} fill={EMPTY_FILL} rotation={angle} origin="0, 0" />;
            }
            const blade = (
              <Path d={bladePath} fill={bladeColor(i, blades, 1, type)} rotation={angle} origin="0, 0" />
            );
            // 방금 채워진 날개만 허브에서 자라나게 한다.
            return fresh.has(i) ? (
              <AnimatedG key={i} scale={grow} origin="0, 0">
                {blade}
              </AnimatedG>
            ) : (
              <G key={i}>{blade}</G>
            );
          })}
          <Circle r={HUB_R + 1.5} fill="#000000" fillOpacity={0.08} />
          <Circle r={HUB_R} fill="#FFFFFF" />
          <Circle r={2.5} fill="#C7C7CC" />
        </Svg>
      </Animated.View>

      {showMonths &&
        Array.from({ length: blades }, (_, i) => {
          // 날개 끝 가운데(돛 폭의 절반 지점) 조금 바깥에 달 숫자를 둔다.
          const rad = ((360 / blades) * i * Math.PI) / 180;
          const lx = bladeWidth / 2;
          const ly = -(BLADE_LEN + 9);
          const x = HUB.x + lx * Math.cos(rad) - ly * Math.sin(rad);
          const y = HUB.y + lx * Math.sin(rad) + ly * Math.cos(rad);
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.monthLabel, { left: x * scale - MONTH_LABEL / 2, top: y * scale - MONTH_LABEL / 2 }]}
            >
              <Text style={styles.monthText} maxFontSizeMultiplier={1.3}>
                {bladeMonth(i, blades)}
              </Text>
            </View>
          );
        })}
    </View>
  );
}

const MONTH_LABEL = 22;

const styles = StyleSheet.create({
  monthLabel: {
    position: 'absolute',
    width: MONTH_LABEL,
    height: MONTH_LABEL,
    borderRadius: MONTH_LABEL / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  monthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3C3C43',
  },
});

/**
 * 도톰한 돛 모양 날개 (위쪽을 향함): 스파(x=0) 한쪽으로 넓게 펼쳐지고 모서리를 크게 둥글린다.
 * 끝에서 fullFrom(날개 길이 비율)까지는 폭 width로 꽉 차고, 허브 쪽으로 오며 좁아진다.
 * 날개가 많으면 fullFrom을 키워 허브 근처에서 이웃 날개와 겹치지 않게 한다.
 */
function sailPath(width: number, corner: number, fullFrom = 0.45): string {
  const L = BLADE_LEN;
  const w = width;
  const r0 = HUB_R + 3;
  const neck =
    fullFrom > 0.45
      ? `Q ${w} ${-L * 0.3} ${w * 0.3} ${-r0 - 3} Q ${w * 0.1} ${-r0} 0 ${-r0} Z`
      : `Q ${w} ${-r0 - 2.2} ${w * 0.35} ${-r0 - 1} Q ${w * 0.1} ${-r0} 0 ${-r0} Z`;
  return (
    `M 0 ${-r0} L 0 ${-L + corner} Q 0 ${-L} ${corner} ${-L} ` +
    `L ${w - corner} ${-L} Q ${w} ${-L} ${w} ${-L + corner} ` +
    `L ${w} ${-L * fullFrom} ${neck}`
  );
}

/** i번째 날개 색. 계단 그래프 막대도 같은 색을 써서 막대와 날개를 이어 준다. */
export function bladeColor(index: number, blades: number, alpha = 1, type: AccountType = 'savings'): string {
  const sweep = SWEEPS[type];
  const pos = ((index % blades) / Math.max(1, blades - 1)) * (sweep.length - 1);
  const i = Math.min(Math.floor(pos), sweep.length - 2);
  const f = pos - i;
  const a = hexToRgb(sweep[i]);
  const b = hexToRgb(sweep[i + 1]);
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgba(${mix.join(', ')}, ${alpha})`;
}

function hexToRgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
