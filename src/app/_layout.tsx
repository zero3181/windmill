import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DB_NAME, migrateDbIfNeeded } from '../lib/db';
import { AccountsProvider } from '../store/AccountsContext';
import { WindmillTypeProvider } from '../store/WindmillTypeContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
            <AccountsProvider>
              <WindmillTypeProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
                  {/* 홈은 제목 대신 위쪽의 큰 풍차(히어로)가 화면을 연다. 뒤로 가기 표시용 이름만 남긴다. */}
                  <Stack.Screen name="index" options={{ title: '내 풍차', headerTitle: '', headerTransparent: true }} />
                  <Stack.Screen name="account/[id]" options={{ title: '' }} />
                  <Stack.Screen name="month/[month]" options={{ title: '월별 만기' }} />
                  <Stack.Screen name="archive" options={{ title: '종료된 계좌' }} />
                  <Stack.Screen name="settings" options={{ title: '설정' }} />
                  <Stack.Screen name="calculator" options={{ title: '풍차 계산기' }} />
                  <Stack.Screen name="rates" options={{ title: '금리 비교' }} />
                  <Stack.Screen name="create-windmill" options={{ title: '풍차 만들기', presentation: 'modal' }} />
                  <Stack.Screen name="add-account" options={{ title: '계좌 등록', presentation: 'modal' }} />
                  <Stack.Screen name="pick-product" options={{ title: '금리 비교', presentation: 'modal' }} />
                  <Stack.Screen name="step-reminder" options={{ title: '가입 알림', presentation: 'modal' }} />
                  <Stack.Screen name="edit-account/[id]" options={{ title: '계좌 수정', presentation: 'modal' }} />
                  <Stack.Screen
                    name="onboarding"
                    options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                  />
                </Stack>
              </WindmillTypeProvider>
            </AccountsProvider>
          </SQLiteProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
