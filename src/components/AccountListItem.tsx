import { useRouter } from 'expo-router';
import React from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { accountSubtitle, formatDday } from '../lib/format';
import type { AccountWithFinancials } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { colors } from '../theme';
import type { Account } from '../types/account';
import { ListRow } from './ui/Grouped';

const ACTION_WIDTH = 76;

/**
 * 계좌 목록 행. 왼쪽으로 밀면 [중도 해지][삭제], 길게 누르면 메뉴가 나온다 (iOS 목록과 같은 방식).
 * onClose/onDelete를 주지 않으면 누르기만 된다.
 */
export function AccountListItem({
  item,
  outsideWindmill = false,
  onClose,
  onDelete,
}: {
  item: AccountWithFinancials;
  /** 가입 기간이 풍차와 달라 날개를 채우지 않는 계좌 */
  outsideWindmill?: boolean;
  onClose?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}) {
  const router = useRouter();
  const { account, financials } = item;
  const isSample = isSampleAccount(account.id);
  const status = account.status === 'closed' ? '중도 해지' : account.status === 'matured' ? '만기 해지' : formatDday(financials.daysToMaturity);
  const open = () => router.push(`/account/${account.id}`);
  const actionable = !isSample && onClose && onDelete && account.status === 'active';

  function showMenu() {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: account.name, options: ['상세 보기', '중도 해지', '삭제', '취소'], destructiveButtonIndex: 2, cancelButtonIndex: 3 },
      (i) => {
        if (i === 0) open();
        if (i === 1) onClose?.(account);
        if (i === 2) onDelete?.(account);
      }
    );
  }

  const row = (
    <View style={styles.rowBg}>
      <ListRow
        title={account.name}
        subtitle={accountSubtitle(account, outsideWindmill ? `${account.termMonths}개월 · 풍차 밖` : undefined) || undefined}
        detail={status}
        detailStyle={account.status === 'active' && financials.daysToMaturity < 0 ? styles.overdue : undefined}
        chevron={!isSample}
        onPress={isSample ? undefined : open}
        onLongPress={actionable && Platform.OS === 'ios' ? showMenu : undefined}
      />
    </View>
  );

  if (!actionable) return row;
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <View style={styles.actions}>
          <Pressable
            style={[styles.action, styles.close]}
            onPress={() => {
              methods.close();
              onClose(account);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>중도 해지</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.delete]}
            onPress={() => {
              methods.close();
              onDelete(account);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>삭제</Text>
          </Pressable>
        </View>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  rowBg: {
    backgroundColor: colors.card,
  },
  overdue: {
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    backgroundColor: colors.warning,
  },
  delete: {
    backgroundColor: colors.danger,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
