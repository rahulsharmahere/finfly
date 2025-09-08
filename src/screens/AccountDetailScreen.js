import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchTransactionsByAccount } from "../utils/fireflyApi";
import ThreeDotMenu from "../components/ThreeDotMenu";
import Footer from "../components/Footer";

const PAGE_SIZE = 15;
const filters = ["1d", "30d", "90d", "YTD", "Custom"];

export default function AccountDetailScreen({ route, navigation }) {
  const { accountId, accountName } = route.params;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState("30d");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const getDateRange = () => {
    let start = null;
    let end = new Date().toISOString().split("T")[0];

    if (filter === "1d")
      start = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    else if (filter === "30d")
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    else if (filter === "90d")
      start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    else if (filter === "YTD")
      start = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    else if (filter === "Custom" && startDate && endDate) {
      start = startDate.toISOString().split("T")[0];
      end = endDate.toISOString().split("T")[0];
    }

    return { start, end };
  };

  const loadTransactions = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const response = await fetchTransactionsByAccount(
        accountId,
        start,
        end,
        pageNum,
        PAGE_SIZE
      );

      const txData = response.data || [];
      const lastPage = response.meta?.last_page || 1;

      setTransactions((prev) => (append ? [...prev, ...txData] : txData));
      setTotalPages(lastPage);
      setPage(pageNum);
    } catch (err) {
      console.error("Error fetching transactions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload when filter or dates change
  useEffect(() => {
    loadTransactions(1, false);
  }, [filter, startDate, endDate]);

  const getTxType = (tx) => (tx.type ? tx.type.toLowerCase() : "unknown");
  const getTxAmount = (tx) => parseFloat(tx.amount || 0);
  const getTxDate = (tx) => new Date(tx.date || 0);
  const getTxDesc = (tx) => tx.description || "No description";

  const renderTransaction = ({ item }) => {
    const type = getTxType(item);
    const amount = getTxAmount(item);
    const date = getTxDate(item);
    const desc = getTxDesc(item);

    return (
      <View style={styles.txCard}>
        <View style={styles.txRow}>
          <Text style={styles.txDate}>{isNaN(date.getTime()) ? "N/A" : date.toDateString()}</Text>
          <Text style={[styles.txAmount, type === "withdrawal" ? styles.debit : styles.credit]}>
            ₹ {amount.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.txDesc}>{desc}</Text>
        <Text style={styles.txType}>{type}</Text>
      </View>
    );
  };

  const renderLoadMore = () => {
    if (page >= totalPages) return null;
    return (
      <TouchableOpacity
        style={styles.loadMoreBtn}
        onPress={() => loadTransactions(page + 1, true)}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadMoreText}>Load More</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{accountName}</Text>
        <ThreeDotMenu />
      </View>

      {/* Filters */}
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
            <Text style={styles.dateBtn}>{startDate ? startDate.toDateString() : "Start Date"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateBtn}>{endDate ? endDate.toDateString() : "End Date"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
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
          onChange={(e, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      {loading && page === 1 ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : !transactions.length ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>No transactions found</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, idx) => item.id.toString() + idx}
          renderItem={renderTransaction}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          ListFooterComponent={
            <>
              {renderLoadMore()}
              <Footer />
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerIcon: { color: "#fff", fontSize: 22 },
  filterRow: { flexDirection: "row", marginVertical: 10, flexWrap: "wrap", paddingHorizontal: 12 },
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
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 12, marginBottom: 10 },
  dateBtn: { padding: 10, backgroundColor: "#f2f2f2", borderRadius: 8 },
  txCard: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10, elevation: 2 },
  txRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  txDate: { fontSize: 12, color: "#666" },
  txAmount: { fontSize: 16, fontWeight: "bold" },
  debit: { color: "#d9534f" },
  credit: { color: "#5cb85c" },
  txDesc: { fontSize: 16, fontWeight: "500" },
  txType: { fontSize: 13, color: "#999", marginTop: 4 },
  loadMoreBtn: { padding: 12, backgroundColor: "#2196F3", borderRadius: 8, marginVertical: 10, alignItems: "center" },
  loadMoreText: { color: "#fff", fontWeight: "bold" },
});
