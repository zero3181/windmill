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
      // 내용 높이에 맞춰 올라오는 시트(fitToContents) 안에서도 내용만큼만 차지하고, 넘치면 스크롤한다.
      style={{ flexGrow: 0 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
