import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchTransactionsByAccount } from "../utils/fireflyApi"; // You'll add this in fireflyApi.js
//import Card from "../components/ui/card";

const filters = ["1d", "30d", "90d", "YTD", "Custom"];

export default function AccountDetailScreen({ route }) {
  const { accountId, accountName } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("30d");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [filter, startDate, endDate]);

  const loadTransactions = async () => {
    setLoading(true);

    let start = null;
    let end = new Date().toISOString().split("T")[0];

    if (filter === "1d") {
      start = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else if (filter === "30d") {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else if (filter === "90d") {
      start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else if (filter === "YTD") {
      const now = new Date();
      start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    } else if (filter === "Custom" && startDate && endDate) {
      start = startDate.toISOString().split("T")[0];
      end = endDate.toISOString().split("T")[0];
    }

    try {
      const data = await fetchTransactionsByAccount(accountId, start, end, 10);
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions", error);
    }
    setLoading(false);
  };

  const renderTransaction = ({ item }) => (
    <Card>
      <Text style={styles.txTitle}>{item.description}</Text>
      <Text>{item.date}</Text>
      <Text>{item.type} - {item.amount} {item.currency}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{accountName}</Text>

      {/* Filter Menu */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={{ color: filter === f ? "#fff" : "#333" }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Date Pickers */}
      {filter === "Custom" && (
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateBtn}>
              {startDate ? startDate.toDateString() : "Start Date"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateBtn}>
              {endDate ? endDate.toDateString() : "End Date"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      {/* Transactions */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>No transactions found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  filterRow: { flexDirection: "row", marginBottom: 10, flexWrap: "wrap" },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterActive: { backgroundColor: "#007bff", borderColor: "#007bff" },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dateBtn: { padding: 10, backgroundColor: "#f2f2f2", borderRadius: 8 },
  txTitle: { fontWeight: "bold", fontSize: 16 },
});
