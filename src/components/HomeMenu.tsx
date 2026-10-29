import { Stack } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

export interface HomeMenuItem {
  label: string;
  icon: { ios: SFSymbol; android: NonNullable<Exclude<SymbolViewProps['name'], string>['android']> };
  onPress: () => void;
}

/**
 * 홈 오른쪽 위 더 보기 메뉴. iOS는 네이티브 툴바 메뉴, Android는 둥근 ⋮ 버튼과 위에서 내려오는 메뉴
 * (Android 투명 제목줄에는 툴바 메뉴가 그려지지 않는다). 두 플랫폼이 같은 항목을 쓴다.
 */
export function HomeMenu({ items }: { items: HomeMenuItem[] }) {
  if (Platform.OS === 'ios') {
    return (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="더 보기">
          {items.map((item) => (
            <Stack.Toolbar.MenuAction key={item.label} icon={item.icon.ios} onPress={item.onPress}>
              {item.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    );
  }
  return <Stack.Screen options={{ headerRight: () => <AndroidMenu items={items} /> }} />;
}

function AndroidMenu({ items }: { items: HomeMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="더 보기"
      >
        {/* 아이콘 글꼴은 기준선 때문에 원 가운데에서 비켜나므로 점 세 개를 직접 그린다 */}
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* 바깥을 누르면 닫힌다 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="메뉴 닫기">
          <View style={[styles.menu, { top: insets.top + 56 }]}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                accessibilityRole="menuitem"
              >
                <SymbolView
                  name={{ ios: item.icon.ios, android: item.icon.android }}
                  size={20}
                  tintColor={colors.text}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <Text style={styles.itemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    elevation: 3,
  },
  pressed: {
    opacity: 0.6,
  },
  dots: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  menu: {
    position: 'absolute',
    right: spacing.md,
    minWidth: 220,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  itemPressed: {
    backgroundColor: colors.barEmpty,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
});
