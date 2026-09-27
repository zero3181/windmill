import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { formatDateShort, formatDday, formatWon } from '../lib/format';
import type { Upcoming } from '../lib/homeSelectors';
import { isSampleAccount } from '../lib/sampleData';
import { colors } from '../theme';
import { GroupedSection, ListRow } from './ui/Grouped';

/** 재가입 여부를 정해야 하는 가까운 만기. */
export function UpcomingSection({ upcoming, interactive = true }: { upcoming: Upcoming; interactive?: boolean }) {
  const router = useRouter();
  if (upcoming.items.length === 0) return null;

  return (
    <GroupedSection
      title="다가오는 만기"
      footer={upcoming.nextOnly ? '30일 안에 만기되는 계좌는 없어요.' : '만기가 되면 재가입할지 해지할지 정해 주세요.'}
    >
      {upcoming.items.map(({ account, financials }) => {
        const overdue = financials.daysToMaturity < 0;
        return (
          <ListRow
            key={account.id}
            title={`${account.name} · ${overdue ? '만기 지남' : formatDday(financials.daysToMaturity)}`}
            subtitle={[account.bank, `${formatDateShort(financials.maturityDate)} 만기`].filter(Boolean).join(' · ')}
            detail={formatWon(financials.maturityPayout)}
            detailStyle={overdue ? styles.overdue : undefined}
            chevron={interactive}
            onPress={interactive && !isSampleAccount(account.id) ? () => router.push(`/account/${account.id}`) : undefined}
          />
        );
      })}
    </GroupedSection>
  );
}

const styles = StyleSheet.create({
  overdue: {
    color: colors.danger,
  },
});
