import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

/**
 * 입력 폼용 스크롤 뷰. 입력칸을 누르면 키보드에 가리지 않도록 그 칸까지 자동으로 스크롤한다.
 * bottomOffset만큼 입력칸 아래 여백을 남겨, 바로 아래 설명 문구도 함께 보이게 한다.
 */
export function FormScrollView({
  children,
  contentContainerStyle,
  bottomOffset = 72,
}: {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomOffset?: number;
}) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
