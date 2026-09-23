import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DB_NAME, migrateDbIfNeeded } from '../lib/db';
import { AccountsProvider } from '../store/AccountsContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
          <AccountsProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: '#F7F8FA' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="account/new" options={{ title: '계좌 등록', presentation: 'modal' }} />
              <Stack.Screen name="account/[id]" options={{ title: '계좌 상세' }} />
              <Stack.Screen name="account/[id]/edit" options={{ title: '계좌 수정', presentation: 'modal' }} />
              <Stack.Screen name="month/[month]" options={{ title: '이번 달 만기' }} />
              <Stack.Screen name="settings" options={{ title: '설정' }} />
            </Stack>
          </AccountsProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
