import { useRouter } from 'expo-router';
import React from 'react';
import { HeaderActions } from '../components/ui/HeaderActions';
import RatesScreen from './rates';

/** 가입 페이지 위에 띄우는 금리 비교. 상품을 고르면 가입 페이지의 은행·상품명·금리를 채운다. */
export default function PickProductScreen() {
  const router = useRouter();
  return (
    <>
      <HeaderActions left={{ label: '닫기', onPress: () => router.back() }} />
      <RatesScreen pick />
    </>
  );
}
