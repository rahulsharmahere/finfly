// src/screens/DashboardScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BarChart } from 'react-native-chart-kit';
import EncryptedStorage from 'react-native-encrypted-storage';

import { getAuthConfig } from '../utils/fireflyApi';

const screenWidth = Dimensions.get('window').width;

const presetRanges = [
  { label: '1d', days: 1 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '180d', days: 180 },
  { label: 'YTD', ytd: true },
  { label: 'Custom' },
];

const currencyFmt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Read current balance safely from various Firefly shapes
const readAccountBalance = (acc) => {
  const a = acc?.attributes || {};

  if (a.current_balance && typeof a.current_balance === 'object') {
    if (a.current_balance.value != null) return parseFloat(a.current_balance.value) || 0;
    if (a.current_balance.converted?.value != null)
      return parseFloat(a.current_balance.converted.value) || 0;
  }
  if (a.current_balance != null && typeof a.current_balance !== 'object')
    return parseFloat(a.current_balance) || 0;

  if (a.balance_float != null) return parseFloat(a.balance_float) || 0;
  if (a.balance != null) return parseFloat(a.balance) || 0;

  return 0;
};

const DashboardScreen = () => {
  const navigation = useNavigation();

  // Top section state
  const [netWorth, setNetWorth] = useState(0);
  const [assetAccounts, setAssetAccounts] = useState([]);       // [{id, name, balance}]
  const [liabilityAccounts, setLiabilityAccounts] = useState([]); // [{id, name, balance}]

  // Chart + transactions state
  const [debitCreditData, setDebitCreditData] = useState([0, 0]);
  const [transactions, setTransactions] = useState([]);

  // Date range state
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(30, 'days').startOf('day'),
    end: moment().endOf('day'),
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);
  const toggleFAB = () => setFabOpen((v) => !v);
  const closeFAB = () => setFabOpen(false);

  // Header menu state (hamburger / overflow)
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => {
    closeFAB();
    setMenuVisible(true);
  };
  const closeMenu = () => setMenuVisible(false);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchAccountsAndNetWorth(),
        fetchDebitCreditData(),
        fetchLastTransactions(),
      ]);
    } catch (e) {
      console.error('Dashboard load error', e);
    }
  }, [dateRange]);

  useEffect(() => {
    const initLoad = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    initLoad();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadData());
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // --- Data fetching ---

  const fetchAccountsPage = async (type, page, config) => {
    return axios.get(
      `accounts?type=${encodeURIComponent(type)}&with_current_balance=true&page[size]=200&page=${page}`,
      config
    );
  };

  const fetchAllAccountsByType = async (type, config) => {
    let page = 1;
    let out = [];
    const MAX_PAGES = 10;
    while (page <= MAX_PAGES) {
      const res = await fetchAccountsPage(type, page, config);
      const items = res?.data?.data || [];
      out = out.concat(items);
      if (items.length < 200) break;
      page += 1;
    }
    return out;
  };

  const fetchAccountsAndNetWorth = async () => {
    try {
      const config = await getAuthConfig();
      const [assetsRaw, liabilitiesRaw] = await Promise.all([
        fetchAllAccountsByType('asset', config),
        fetchAllAccountsByType('liability', config),
      ]);

      const assets = (assetsRaw || []).map((acc) => ({
        id: acc.id,
        name: acc.attributes?.name || 'Unnamed Asset',
        balance: readAccountBalance(acc),
      }));

      const liabilities = (liabilitiesRaw || []).map((acc) => ({
        id: acc.id,
        name: acc.attributes?.name || 'Unnamed Liability',
        balance: readAccountBalance(acc),
      }));

      assets.sort((a, b) => b.balance - a.balance);
      liabilities.sort((a, b) => b.balance - a.balance);

      const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
      const totalLiabilities = liabilities.reduce((s, l) => s + (l.balance || 0), 0);
      const nw = totalAssets - totalLiabilities;

      setAssetAccounts(assets);
      setLiabilityAccounts(liabilities);
      setNetWorth(nw);
    } catch (err) {
      console.error('Error fetching accounts/net worth:', err);
      setAssetAccounts([]);
      setLiabilityAccounts([]);
      setNetWorth(0);
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

      const sumAmounts = (items) =>
        (items || []).reduce(
          (sum, item) =>
            sum +
            ((item.attributes?.transactions || []).reduce(
              (innerSum, tx) => innerSum + (parseFloat(tx.amount) || 0),
              0
            )),
          0
        );

      setDebitCreditData([
        sumAmounts(debitRes.data?.data),
        sumAmounts(creditRes.data?.data),
      ]);
    } catch (error) {
      console.error('Error fetching debit/credit:', error);
      setDebitCreditData([0, 0]);
    }
  };

  const fetchLastTransactions = async () => {
    try {
      const config = await getAuthConfig();
      const start = dateRange.start.format('YYYY-MM-DD');
      const end = dateRange.end.format('YYYY-MM-DD');

      const res = await axios.get(
        `transactions?start=${start}&end=${end}&page[size]=10&sort=-date`,
        config
      );
      setTransactions(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching last transactions:', error);
      setTransactions([]);
    }
  };

  // --- Helpers ---

  const capitalize = (str = '') =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const onTransactionPress = (transactionId) => {
    if (!transactionId) return;
    navigation.navigate('TransactionEdit', { id: transactionId });
  };

  const renderTransaction = ({ item }) => {
    const attrs = item.attributes || {};
    const firstTx =
      Array.isArray(attrs.transactions) && attrs.transactions.length > 0
        ? attrs.transactions[0]
        : {};
    const dateObj = firstTx.date ? moment(firstTx.date) : null;

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => onTransactionPress(item.id)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.transactionDateDayMonth}>
            {dateObj ? dateObj.format('DD MMM') : 'N/A'}
          </Text>
          <Text style={styles.transactionDateYear}>
            {dateObj ? dateObj.format('YYYY') : ''}
          </Text>
        </View>

        <Text style={{ flex: 3 }}>
          {firstTx.description || 'No description'}
        </Text>

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text
            style={{
              color: firstTx.type === 'withdrawal' ? 'red' : 'green',
              fontWeight: 'bold',
            }}
          >
            ₹
            {parseFloat(firstTx.amount || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {capitalize(firstTx.type)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const onSelectPreset = (preset) => {
    if (preset.label === 'Custom') {
      setShowStartPicker(true);
    } else if (preset.ytd) {
      setDateRange({
        start: moment().startOf('year'),
        end: moment().endOf('day'),
      });
    } else {
      setDateRange({
        start: moment().subtract(preset.days, 'days').startOf('day'),
        end: moment().endOf('day'),
      });
    }
  };

  const onChangeStart = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateRange((prev) => ({
        start: moment(selectedDate).startOf('day'),
        end: prev.end,
      }));
      setShowEndPicker(true);
    }
  };

  const onChangeEnd = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateRange((prev) => ({
        start: prev.start,
        end: moment(selectedDate).endOf('day'),
      }));
    }
  };

  // --- Header menu handlers ---

  const handleLogout = async () => {
    try {
      await EncryptedStorage.clear();
    } catch (e) {
      console.warn('Failed to clear secure storage:', e);
    }
    closeMenu();
    // Try to go to a login/auth screen if you have one; otherwise show a note.
    try {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Alert.alert('Logged out', 'Credentials cleared. Please reopen the app to sign in again.');
    }
  };

  const handleAbout = () => {
    closeMenu();
    try {
      navigation.navigate('About');
    } catch {
      Alert.alert('About', 'FinFly Test App\nReact Native Dashboard');
    }
  };

  // --- Render ---

  return (
    <View style={styles.container}>
      {/* HEADER with Hamburger & Overflow */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FinFly Dashboard</Text>
        <TouchableOpacity onPress={openMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Simple overflow menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
            <Text style={styles.menuText}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={closeMenu}>
            <Text style={[styles.menuText, { color: '#888' }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Date filter buttons */}
      <View style={styles.filterRow}>
        {presetRanges.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={styles.filterButton}
            onPress={() => onSelectPreset(preset)}
          >
            <Text style={styles.filterButtonText}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* NET WORTH + ACCOUNTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Net Worth</Text>
          <Text style={styles.netWorthValue}>{currencyFmt(netWorth)}</Text>

          {/* Assets */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Assets</Text>
            {assetAccounts.length === 0 ? (
              <Text style={styles.emptyText}>No asset accounts found</Text>
            ) : (
              assetAccounts.map((acc) => (
                <View key={acc.id} style={styles.row}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={styles.rowAmount}>{currencyFmt(acc.balance)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Liabilities */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Liabilities</Text>
            {liabilityAccounts.length === 0 ? (
              <Text style={styles.emptyText}>No liability accounts found</Text>
            ) : (
              liabilityAccounts.map((acc) => (
                <View key={acc.id} style={styles.row}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={styles.rowAmount}>
                    {currencyFmt(acc.balance)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* DEBIT VS CREDIT */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Debit vs Credit ({dateRange.start.format('DD MMM')} - {dateRange.end.format('DD MMM')})
          </Text>
          <BarChart
            data={{
              labels: ['Debit', 'Credit'],
              datasets: [{ data: debitCreditData }],
            }}
            width={screenWidth - 64}
            height={220}
            yAxisLabel="₹"
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            fromZero
            showValuesOnTopOfBars
          />
        </View>

        {/* LAST TRANSACTIONS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 10 Transactions</Text>
          {transactions.length === 0 ? (
            <Text>No transactions found</Text>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Date pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={dateRange.start.toDate()}
          mode="date"
          display="default"
          onChange={onChangeStart}
          maximumDate={dateRange.end.toDate()}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={dateRange.end.toDate()}
          mode="date"
          display="default"
          onChange={onChangeEnd}
          minimumDate={dateRange.start.toDate()}
          maximumDate={new Date()}
        />
      )}

      {/* FAB overlay */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={closeFAB}>
          <View style={styles.dimmedBackground} />
        </TouchableWithoutFeedback>
      )}

      {/* FAB + actions */}
      <View style={styles.fabContainer}>
        {fabOpen && (
          <View style={styles.fabOptions}>
            <TouchableOpacity
              style={styles.fabOption}
              onPress={() => {
                closeFAB();
                navigation.navigate('Withdraw');
              }}
            >
              <Text style={styles.fabOptionIcon}>↧</Text>
              <Text style={styles.fabOptionText}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fabOption}
              onPress={() => {
                closeFAB();
                navigation.navigate('Deposit');
              }}
            >
              <Text style={styles.fabOptionIcon}>↥</Text>
              <Text style={styles.fabOptionText}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fabOption}
              onPress={() => {
                closeFAB();
                navigation.navigate('Transfer');
              }}
            >
              <Text style={styles.fabOptionIcon}>⇄</Text>
              <Text style={styles.fabOptionText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={toggleFAB}>
          <Text style={styles.fabPlus}>{fabOpen ? '×' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerIcon: { fontSize: 22, color: '#fff' },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  filterButtonText: { fontWeight: 'bold' },

  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  netWorthValue: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', marginBottom: 8 },

  subSection: { marginTop: 10 },
  subSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6, color: '#333' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowName: { flex: 1, marginRight: 8 },
  rowAmount: { fontWeight: '600' },
  emptyText: { color: '#666' },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },

  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  transactionDateDayMonth: { fontWeight: 'bold' },
  transactionDateYear: { fontSize: 12, color: '#666' },

  // Menu (Modal)
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menuContainer: {
    position: 'absolute',
    top: 54,
    right: 10,
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  menuText: { fontSize: 16, color: '#222' },

  // FAB
  dimmedBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 98,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  fab: {
    backgroundColor: '#2196F3',
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabPlus: { color: '#fff', fontSize: 28, lineHeight: 28, marginTop: -2 },

  fabOptions: { marginBottom: 12, alignItems: 'flex-end' },
  fabOption: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabOptionIcon: { color: '#fff', fontSize: 16, marginRight: 6 },
  fabOptionText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
