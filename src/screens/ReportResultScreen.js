import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function ReportResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { payload } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PAGE_SIZE = 25;

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const config = await getAuthConfig();

        let url = "";

        if (payload.reportType === "transaction") {
          url = `transactions?start=${payload.start}&end=${payload.end}&limit=${PAGE_SIZE}&page=${page}`;

          // ✅ Force add account filter if selected
          if (Array.isArray(payload.accounts) && payload.accounts.length > 0) {
            payload.accounts.forEach((acc) => {
              const accId = typeof acc === "object" ? acc.id : acc;
              if (accId) {
                url += `&account_id[]=${accId}`;
              }
            });
          }
        } else if (
          payload.reportType === "category" &&
          Array.isArray(payload.categories) &&
          payload.categories.length > 0
        ) {
          const ids = payload.categories.map((c) => c.id).join(",");
          url = `categories/${ids}/transactions?start=${payload.start}&end=${payload.end}&limit=${PAGE_SIZE}&page=${page}`;
        } else if (
          payload.reportType === "tag" &&
          Array.isArray(payload.tags) &&
          payload.tags.length > 0
        ) {
          const ids = payload.tags.map((t) => t.id).join(",");
          url = `tags/${ids}/transactions?start=${payload.start}&end=${payload.end}&limit=${PAGE_SIZE}&page=${page}`;
        } else {
          setTransactions([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        console.log("🚀 Final Report URL:", url);
        console.log("📌 Selected Accounts:", payload.accounts);

        const response = await axios.get(url, config);
        const data = response.data?.data || [];
        const meta = response.data?.meta?.pagination;

        setTransactions(data);
        setTotalPages(meta?.total_pages || 1);

        console.log("📊 Pagination Info:", meta);
        if (data.length > 0) {
          console.log("📝 First few transactions:");
          data.slice(0, 5).forEach((item, idx) => {
            const tx = item.attributes.transactions?.[0] || {};
            console.log(
              `#${idx + 1}: id=${item.id}, type=${item.attributes.type}, amount=${tx.amount}, source=${tx.source_name}, dest=${tx.destination_name}`
            );
          });
        }
      } catch (err) {
        console.error("Error fetching report data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [payload, page]);

  const renderTransaction = ({ item }) => {
    const attrs = item.attributes || {};
    const tx = attrs.transactions?.[0] || {};

    const description = attrs.description || tx.description || "No description";
    const type = attrs.type || tx.type || "Unknown";
    const amount = tx.amount || attrs.amount || "0";
    const currency = tx.currency_code || attrs.currency_code || "₹";
    const date = attrs.date || tx.date || "";

    let accountName = "";
    if (type === "withdrawal") {
      accountName = tx.source_name || "";
    } else if (type === "deposit") {
      accountName = tx.destination_name || "";
    } else if (type === "transfer") {
      const from = tx.source_name || "";
      const to = tx.destination_name || "";
      accountName = from && to ? `${from} → ${to}` : from || to || "";
    }

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => navigation.navigate("TransactionEdit", { id: item.id })}
      >
        <View style={styles.txRow}>
          <Text style={styles.txDate}>
            {date ? new Date(date).toDateString() : "N/A"}
          </Text>
          <Text
            style={[
              styles.txAmount,
              type === "withdrawal" ? styles.debit : styles.credit,
            ]}
          >
            {currency} {parseFloat(amount).toFixed(2)}
          </Text>
        </View>
        <Text style={styles.txDesc} numberOfLines={1}>
          {description}
        </Text>
        {accountName ? (
          <Text style={styles.accountName}>{accountName}</Text>
        ) : null}
        <Text style={styles.txType}>{type}</Text>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPages = () => {
      const range = [];
      const delta = 2;
      const left = Math.max(2, page - delta);
      const right = Math.min(totalPages - 1, page + delta);

      range.push(1);
      if (left > 2) range.push("...");
      for (let i = left; i <= right; i++) range.push(i);
      if (right < totalPages - 1) range.push("...");
      if (totalPages > 1) range.push(totalPages);

      return range;
    };

    return (
      <View style={styles.pagination}>
        {getPages().map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.pageBtn, page === p && styles.activePageBtn]}
            onPress={() => typeof p === "number" && setPage(p)}
            disabled={p === "..."}
          >
            <Text
              style={[styles.pageText, page === p && styles.activePageText]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Results</Text>
        <ThreeDotMenu />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : !transactions.length ? (
        <View style={styles.loader}>
          <Text style={{ color: "#fff" }}>
            No results found for this report.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={transactions}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            renderItem={renderTransaction}
            contentContainerStyle={styles.list}
          />
          {renderPagination()}
        </>
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2196F3",
  },
  list: { padding: 12 },
  txCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  txDate: { fontSize: 12, color: "#666" },
  txDesc: { fontSize: 16, fontWeight: "500" },
  accountName: { fontSize: 12, color: "#555", marginTop: 2 },
  txType: { fontSize: 13, color: "#999", marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: "bold" },
  debit: { color: "#d9534f" },
  credit: { color: "#5cb85c" },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  pageBtn: {
    marginHorizontal: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  pageText: { color: "#2196F3", fontWeight: "bold" },
  activePageBtn: { backgroundColor: "#2196F3" },
  activePageText: { color: "#fff" },
});
