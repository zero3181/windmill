import { DynamicColorIOS, Platform, useColorScheme, type ColorValue } from 'react-native';

/** 밝은 화면/어두운 화면 색을 함께 둔다. iOS는 시스템 설정(다크 모드)을 따라 바뀌고, 그 밖에서는 밝은 색을 쓴다. */
function dynamic(light: string, dark: string): ColorValue {
  return Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;
}

/** 어두운 화면인지: colors와 같은 기준(iOS에서 시스템 다크 모드)으로 판단한다. SVG처럼 동적 색을 못 받는 곳에서 쓴다. */
export function useDarkMode(): boolean {
  const scheme = useColorScheme();
  return Platform.OS === 'ios' && scheme === 'dark';
}

/** iOS 27 시스템 색상 (Apple iOS and iPadOS 27 UI Kit, Light / Dark) */
export const colors = {
  /** Backgrounds (Grouped)/Primary */
  bg: dynamic('#F2F2F7', '#000000'),
  /** Backgrounds (Grouped)/Secondary */
  card: dynamic('#FFFFFF', '#1C1C1E'),
  /** Labels/Primary */
  text: dynamic('#000000', '#FFFFFF'),
  /** Labels/Secondary */
  textMuted: dynamic('rgba(60, 60, 67, 0.6)', 'rgba(235, 235, 245, 0.6)'),
  /** Labels/Tertiary */
  textFaint: dynamic('rgba(60, 60, 67, 0.3)', 'rgba(235, 235, 245, 0.3)'),
  /** Accents/Blue */
  primary: dynamic('#0088FF', '#0091FF'),
  primarySoft: dynamic('rgba(0, 136, 255, 0.14)', 'rgba(0, 145, 255, 0.24)'),
  /** Separators/Non-opaque */
  border: dynamic('rgba(60, 60, 67, 0.18)', 'rgba(84, 84, 88, 0.65)'),
  /** Accents/Red */
  danger: dynamic('#FF383C', '#FF4245'),
  dangerSoft: dynamic('rgba(255, 56, 60, 0.12)', 'rgba(255, 66, 69, 0.22)'),
  /** Accents/Green */
  success: dynamic('#34C759', '#30D158'),
  /** Accents/Orange */
  warning: dynamic('#FF8D28', '#FF9230'),
  /** Fills/Tertiary */
  barEmpty: dynamic('rgba(118, 118, 128, 0.12)', 'rgba(118, 118, 128, 0.24)'),
  /** 토스트처럼 화면 위에 뜨는 어두운 판 */
  overlay: dynamic('rgba(0, 0, 0, 0.82)', 'rgba(58, 58, 60, 0.96)'),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 26,
  full: 999,
};
