import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AccountListItem } from '../components/AccountListItem';
import { EmptyState } from '../components/EmptyState';
import { SummaryCard } from '../components/SummaryCard';
import { ThisMonthSection } from '../components/ThisMonthSection';
import { TimelineChart } from '../components/TimelineChart';
import { todayKST } from '../lib/calc';
import { selectSummary, selectThisMonth, selectTimeline, withFinancials } from '../lib/homeSelectors';
import { buildSampleAccounts } from '../lib/sampleData';
import { useAccounts } from '../store/AccountsContext';
import { colors, radius, spacing } from '../theme';

export default function HomeScreen() {
  const router = useRouter();
  const { accounts, loading } = useAccounts();
  const today = todayKST();
  const isDemo = !loading && accounts.length === 0;

  const activeAccounts = useMemo(() => accounts.filter((a) => a.status === 'active'), [accounts]);
  const demoAccounts = useMemo(() => (isDemo ? buildSampleAccounts(today) : []), [isDemo, today]);
  const sourceAccounts = isDemo ? demoAccounts : activeAccounts;

  const items = useMemo(() => withFinancials(sourceAccounts, today), [sourceAccounts, today]);
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.financials.daysToMaturity - b.financials.daysToMaturity),
    [items]
  );
  const summary = useMemo(() => selectSummary(items), [items]);
  const thisMonth = useMemo(() => selectThisMonth(items, today), [items, today]);
  const timeline = useMemo(() => selectTimeline(items, today, 12), [items, today]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <HeaderBar onSettingsPress={() => router.push('/settings')} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isDemo ? (
          <>
            <EmptyState />
            <TimelineChart months={timeline} hero interactive={false} />
            <SummaryCard summary={summary} />
            <ThisMonthSection thisMonth={thisMonth} />
          </>
        ) : (
          <>
            <SummaryCard summary={summary} />
            <ThisMonthSection thisMonth={thisMonth} />
            <TimelineChart months={timeline} />
          </>
        )}

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>계좌 목록</Text>
          <View style={styles.listCard}>
            {sortedItems.map((item) => (
              <AccountListItem key={item.account.id} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/account/new')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function HeaderBar({ onSettingsPress }: { onSettingsPress: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>풍차관리</Text>
      <Pressable onPress={onSettingsPress} hitSlop={12}>
        <Text style={styles.settingsIcon}>⚙︎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 3,
  },
  listSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  listCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '400',
    marginTop: -2,
  },
});
