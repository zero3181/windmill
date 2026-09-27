import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

// 전체 그림은 240x188 좌표계에서 그리고, 날개만 허브를 중심으로 따로 돌린다.
const VIEW = 240;
const VIEW_H = 188;
const HUB = { x: 120, y: 84 };
const BLADE_LEN = 72;
const HUB_R = 9;
const BLADE_BOX = (BLADE_LEN + 4) * 2;

// 날개 색: 민트 → 블루 → 인디고로 한 바퀴 이어지는 iOS 시스템 액센트 그라데이션.
const SWEEP = ['#00C8B3', '#00C0E8', '#0088FF', '#6155F5'];
/** 아직 채우지 않은 날개 자리 (Activity 링의 빈 트랙처럼). 뒤의 탑이 비치지 않게 불투명하게 쓴다. */
const EMPTY_FILL = '#E9E9EE';

interface Props {
  /** 날개 수 = 가입 기간(개월) */
  blades: number;
  /** 채워진 날개 수 (만기월이 다른 계좌 수) */
  filled: number;
  width: number;
}

/** 만기월이 다른 계좌가 생길 때마다 날개가 하나씩 채워지고, 다 채우면 돌아가는 풍차. */
export function Windmill({ blades, filled, width }: Props) {
  const count = Math.min(filled, blades);
  const complete = count >= blades;
  const scale = width / VIEW;

  const [spin] = useState(() => new Animated.Value(0));
  const [wiggle] = useState(() => new Animated.Value(0));
  const [grow] = useState(() => new Animated.Value(1));
  const prevCount = useRef(count);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // 날개가 새로 생기면 허브에서 스프링으로 자라나고, 로터가 살짝 밀린다.
  useEffect(() => {
    if (count > prevCount.current && !reduceMotion) {
      grow.setValue(0.3);
      wiggle.setValue(-8);
      Animated.parallel([
        Animated.spring(grow, { toValue: 1, friction: 6, tension: 90, useNativeDriver: false }),
        Animated.spring(wiggle, { toValue: 0, friction: 4, tension: 60, useNativeDriver: true }),
      ]).start();
    }
    prevCount.current = count;
  }, [count, reduceMotion, grow, wiggle]);

  // 날개를 모두 채우면 천천히 계속 돈다.
  useEffect(() => {
    if (!complete || reduceMotion) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [complete, reduceMotion, spin]);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const wiggleDeg = wiggle.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] });

  const bladePath = blades <= 6 ? sailPath(9, 30, 6) : sailPath(5, 17, 4);
  const box = BLADE_BOX * scale;

  return (
    <View
      style={{ width, height: width * (VIEW_H / VIEW) }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={complete ? `풍차 완성, 날개 ${blades}개` : `풍차 날개 ${blades}개 중 ${count}개 채움`}
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
        {/* 탑: 날개 바로 아래까지만 오는 짧은 기둥 */}
        <Path d="M107 180 L115.5 92 Q120 87 124.5 92 L133 180 Q120 182.5 107 180 Z" fill="url(#tower)" />
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
            if (i >= count) {
              return <Path key={i} d={bladePath} fill={EMPTY_FILL} rotation={angle} origin="0, 0" />;
            }
            const blade = (
              <Path d={bladePath} fill={bladeColor(i, blades)} rotation={angle} origin="0, 0" />
            );
            // 가장 최근에 채워진 날개만 허브에서 자라나게 한다.
            return i === count - 1 ? (
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
    </View>
  );
}

/**
 * 풍차 돛 모양 날개 (위쪽을 향함): 스파(x=0)를 따라 한쪽으로만 펼쳐진 사다리꼴.
 * 허브 쪽 폭 inner에서 끝 폭 outer로 넓어지고, 바깥 모서리는 corner만큼 둥글린다.
 */
function sailPath(inner: number, outer: number, corner: number): string {
  const L = BLADE_LEN;
  const r0 = HUB_R + 1;
  const r1 = L * 0.3;
  return (
    `M 0 ${-r0} L 0 ${-L + corner} Q 0 ${-L} ${corner} ${-L} ` +
    `L ${outer - corner} ${-L} Q ${outer} ${-L} ${outer} ${-L + corner} ` +
    `L ${inner} ${-r1} Q ${inner * 0.5} ${-r0 - 2} 0 ${-r0} Z`
  );
}

/** i번째 날개 색. 계단 그래프 막대도 같은 색을 써서 막대와 날개를 이어 준다. */
export function bladeColor(index: number, blades: number, alpha = 1): string {
  const pos = ((index % blades) / Math.max(1, blades - 1)) * (SWEEP.length - 1);
  const i = Math.min(Math.floor(pos), SWEEP.length - 2);
  const f = pos - i;
  const a = hexToRgb(SWEEP[i]);
  const b = hexToRgb(SWEEP[i + 1]);
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgba(${mix.join(', ')}, ${alpha})`;
}

function hexToRgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
