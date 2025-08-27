import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const currencyFmt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });

export default function NetWorthSection({ netWorth, assetAccounts, liabilityAccounts }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Net Worth</Text>
      <Text style={styles.netWorth}>{currencyFmt(netWorth)}</Text>

      <Text style={styles.subtitle}>Assets</Text>
      {(assetAccounts || []).length === 0
        ? <Text>No assets</Text>
        : assetAccounts.map(a => (
          <View key={a.id} style={styles.row}>
            <Text>{a.name}</Text><Text>{currencyFmt(a.balance)}</Text>
          </View>
        ))}

      <Text style={styles.subtitle}>Liabilities</Text>
      {(liabilityAccounts || []).length === 0
        ? <Text>No liabilities</Text>
        : liabilityAccounts.map(l => (
          <View key={l.id} style={styles.row}>
            <Text>{l.name}</Text><Text>{currencyFmt(l.balance)}</Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold' },
  netWorth: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', marginBottom: 8 },
  subtitle: { fontWeight: '600', marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }
});
