import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
  RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getAuthConfig } from '../utils/fireflyApi';

// Components
import NetWorthSection from '../components/dashboard/NetWorthSection';
import DebitCreditChart from '../components/dashboard/DebitCreditChart';
import TransactionsList from '../components/dashboard/TransactionsList';
import AnimatedFAB from '../components/AnimatedFAB';
import ThreeDotMenu from '../components/ThreeDotMenu';

const presetRanges = [
  { label: '1d', days: 1 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '180d', days: 180 },
  { label: 'YTD', ytd: true },
  { label: 'Custom' },
];

const DashboardScreen = () => {
  const navigation = useNavigation();

  const [netWorth, setNetWorth] = useState(0);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState([]);

  const [debitCreditData, setDebitCreditData] = useState([0, 0]);
  const [transactions, setTransactions] = useState([]);

  const [dateRange, setDateRange] = useState({
    start: moment().subtract(30, 'days').startOf('day'),
    end: moment().endOf('day'),
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------- FETCHING ----------------
  const fetchAccountsAndNetWorth = async () => {
    try {
      const config = await getAuthConfig();
      const resAssets = await axios.get('accounts?type=asset&with_current_balance=true', config);
      const resLiabilities = await axios.get('accounts?type=liability&with_current_balance=true', config);

      const assets = (resAssets.data?.data || []).map(acc => ({
        id: acc.id,
        name: acc.attributes?.name || 'Unnamed Asset',
        balance: parseFloat(acc.attributes?.current_balance) || 0,
      }));
      const liabilities = (resLiabilities.data?.data || []).map(acc => ({
        id: acc.id,
        name: acc.attributes?.name || 'Unnamed Liability',
        balance: parseFloat(acc.attributes?.current_balance) || 0,
      }));

      const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
      const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);

      setAssetAccounts(assets);
      setLiabilityAccounts(liabilities);
      setNetWorth(totalAssets - totalLiabilities);
    } catch (e) {
      console.error('fetchAccounts error', e);
    }
  };

  const fetchDebitCreditData = async () => {
    try {
      const config = await getAuthConfig();
      const start = dateRange.start.format('YYYY-MM-DD');
      const end = dateRange.end.format('YYYY-MM-DD');

      const [debitRes, creditRes] = await Promise.all([
        axios.get(`transactions?type=withdrawal&start=${start}&end=${end}`, config),
        axios.get(`transactions?type=deposit&start=${start}&end=${end}`, config),
      ]);

      const sum = (arr) =>
        (arr || []).reduce(
          (s, item) =>
            s + (item.attributes?.transactions || []).reduce(
              (ss, t) => ss + (parseFloat(t.amount) || 0), 0
            ),
          0
        );

      setDebitCreditData([sum(debitRes.data?.data), sum(creditRes.data?.data)]);
    } catch (e) {
      console.error('fetchDebitCredit error', e);
      setDebitCreditData([0, 0]);
    }
  };

  const fetchLastTransactions = async () => {
    try {
      const config = await getAuthConfig();
      const start = dateRange.start.format('YYYY-MM-DD');
      const end = dateRange.end.format('YYYY-MM-DD');

      const res = await axios.get(
        `transactions?start=${start}&end=${end}&page[size]=10&sort=-date`, config
      );
      setTransactions(res.data?.data || []);
    } catch (e) {
      console.error('fetchTransactions error', e);
      setTransactions([]);
    }
  };

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchAccountsAndNetWorth(),
      fetchDebitCreditData(),
      fetchLastTransactions(),
    ]);
  }, [dateRange]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData().finally(() => setIsLoading(false));
    }, [loadData])
  );

  // ---------------- HANDLERS ----------------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const onSelectPreset = (preset) => {
    if (preset.label === 'Custom') setShowStartPicker(true);
    else if (preset.ytd) {
      setDateRange({ start: moment().startOf('year'), end: moment().endOf('day') });
    } else {
      setDateRange({ start: moment().subtract(preset.days, 'days').startOf('day'), end: moment().endOf('day') });
    }
  };

  const onChangeStart = (_, date) => {
    setShowStartPicker(false);
    if (date) { setDateRange(prev => ({ ...prev, start: moment(date).startOf('day') })); setShowEndPicker(true); }
  };
  const onChangeEnd = (_, date) => {
    setShowEndPicker(false);
    if (date) { setDateRange(prev => ({ ...prev, end: moment(date).endOf('day') })); }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FinFly Dashboard</Text>
        <ThreeDotMenu
          assetAccounts={assetAccounts}
          liabilityAccounts={liabilityAccounts}
        />
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <NetWorthSection
          netWorth={netWorth}
          assetAccounts={assetAccounts}
          liabilityAccounts={liabilityAccounts}
        />

        <View style={styles.filterRow}>
          {presetRanges.map(p => (
            <TouchableOpacity key={p.label} style={styles.filterButton} onPress={() => onSelectPreset(p)}>
              <Text style={styles.filterButtonText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <DebitCreditChart debitCreditData={debitCreditData} dateRange={dateRange} />

        <TransactionsList transactions={transactions} navigation={navigation} />

      </ScrollView>

      {showStartPicker && (
        <DateTimePicker value={dateRange.start.toDate()} mode="date" onChange={onChangeStart}
          maximumDate={dateRange.end.toDate()} />
      )}
      {showEndPicker && (
        <DateTimePicker value={dateRange.end.toDate()} mode="date" onChange={onChangeEnd}
          minimumDate={dateRange.start.toDate()} maximumDate={new Date()} />
      )}

      {isLoading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#2196F3" /></View>}

      <SafeAreaView edges={['bottom']} style={styles.fabContainer}>
        <AnimatedFAB navigation={navigation} />
      </SafeAreaView>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 12,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 6, marginTop: 8 },
  filterButton: { padding: 6, backgroundColor: '#e0e0e0', borderRadius: 12 },
  filterButtonText: { fontWeight: 'bold' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 50 },
  fabContainer: { position: 'absolute', right: 5, bottom: 35 },
});
