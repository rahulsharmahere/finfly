import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { fetchActualBalance } from "../../utils/fireflyBalances";

const currencyFmt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

export default function NetWorthSection({ assetAccounts, liabilityAccounts }) {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalances() {
      try {
        const allAccounts = [...(assetAccounts || []), ...(liabilityAccounts || [])];

        const balanceResults = await Promise.all(
          allAccounts.map((acc) => fetchActualBalance(acc.id))
        );

        const results = {};
        allAccounts.forEach((acc, idx) => {
          results[acc.id] = balanceResults[idx];
        });

        setBalances(results);
      } catch (err) {
        console.error("❌ Error loading balances:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBalances();
  }, [assetAccounts, liabilityAccounts]);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Net Worth</Text>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const netWorth =
    (assetAccounts || []).reduce((sum, a) => sum + (balances[a.id] || 0), 0) -
    (liabilityAccounts || []).reduce((sum, l) => sum + (balances[l.id] || 0), 0);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Net Worth</Text>
      <Text style={styles.netWorth}>{currencyFmt(netWorth)}</Text>

      <Text style={styles.subtitle}>Assets</Text>
      {(assetAccounts || []).length === 0 ? (
        <Text>No assets</Text>
      ) : (
        assetAccounts.map((a) => (
          <View key={a.id} style={styles.row}>
            <Text>{a.name}</Text>
            <Text>{currencyFmt(balances[a.id] || 0)}</Text>
          </View>
        ))
      )}

      <Text style={styles.subtitle}>Liabilities</Text>
      {(liabilityAccounts || []).length === 0 ? (
        <Text>No liabilities</Text>
      ) : (
        liabilityAccounts.map((l) => (
          <View key={l.id} style={styles.row}>
            <Text>{l.name}</Text>
            <Text>{currencyFmt(balances[l.id] || 0)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "bold" },
  netWorth: { fontSize: 24, fontWeight: "bold", color: "#2196F3", marginBottom: 8 },
  subtitle: { fontWeight: "600", marginTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
});
