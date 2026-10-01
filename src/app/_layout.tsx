import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppLockGate } from '../components/AppLock';
import { DB_NAME, migrateDbIfNeeded } from '../lib/db';
import { AccountsProvider } from '../store/AccountsContext';
import { WindmillTypeProvider } from '../store/WindmillTypeContext';
import { colors, useDarkMode } from '../theme';

/**
 * 내용 높이만큼만 올라오는 시트 (아래 빈 영역이 생기지 않게).
 * iOS: 제목줄을 투명하게 두면 내용이 제목줄 밑에서 시작하는데 시트 높이는 제목줄 높이를 더해 잡혀서,
 * 맨 아래 내용이 터치 영역 밖으로 밀려난다. 불투명 제목줄로 내용이 제목줄 아래에서 시작하게 한다.
 * Android 시트에는 제목줄(취소·저장 버튼)이 없어서 제목줄이 있는 전체 화면 모달로 연다.
 */
const FIT_SHEET =
  Platform.OS === 'ios'
    ? ({
        presentation: 'formSheet',
        sheetAllowedDetents: 'fitToContents',
        sheetGrabberVisible: true,
        headerTransparent: false,
      } as const)
    : ({ presentation: 'modal' } as const);

export default function RootLayout() {
  // 내비게이션 막대와 화면 바탕이 시스템 다크 모드를 따르게 한다.
  const theme = useDarkMode() ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
              <AccountsProvider>
                <WindmillTypeProvider>
                  <StatusBar style="auto" />
                  <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
                    {/* 홈은 제목 대신 위쪽의 큰 풍차(히어로)가 화면을 연다. 뒤로 가기 표시용 이름만 남긴다. */}
                    <Stack.Screen name="index" options={{ title: '내 풍차', headerTitle: '', headerTransparent: true }} />
                    <Stack.Screen name="account/[id]" options={{ title: '' }} />
                    <Stack.Screen name="month/[month]" options={{ title: '월별 만기' }} />
                    <Stack.Screen name="archive" options={{ title: '종료된 계좌' }} />
                    <Stack.Screen name="settings" options={{ title: '설정' }} />
                    <Stack.Screen name="rates" options={{ title: '금리 비교' }} />
                    <Stack.Screen name="create-windmill" options={{ title: '풍차 만들기', ...FIT_SHEET }} />
                    <Stack.Screen name="add-account" options={{ title: '계좌 등록', ...FIT_SHEET }} />
                    <Stack.Screen name="pick-product" options={{ title: '금리 비교', presentation: 'modal' }} />
                    <Stack.Screen name="step-reminder" options={{ title: '가입 알림', ...FIT_SHEET }} />
                    <Stack.Screen name="edit-account/[id]" options={{ title: '계좌 수정', ...FIT_SHEET }} />
                    <Stack.Screen
                      name="onboarding"
                      options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
                    />
                  </Stack>
                  {/* 잠금을 켜 두면 모든 화면 위를 가린다 */}
                  <AppLockGate />
                </WindmillTypeProvider>
              </AccountsProvider>
            </SQLiteProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
