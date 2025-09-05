import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import ThreeDotMenu from "../components/ThreeDotMenu";

const PAGE_SIZE = 25;

export default function ReportResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { payload } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [allTx, setAllTx] = useState([]); // full, merged dataset
  const [page, setPage] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | deposit | transfer | withdrawal

  // Helper: fetch ALL pages for a given base URL (without &page=… &limit=…)
  const fetchAllPages = async (baseUrl, config) => {
    let pageNum = 1;
    let results = [];
    let totalPages = 1;

    while (pageNum <= totalPages) {
      const url = `${baseUrl}&limit=${PAGE_SIZE}&page=${pageNum}`;
      const res = await axios.get(url, config);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      const meta = res.data?.meta?.pagination;
      totalPages = meta?.total_pages || 1;
      results = results.concat(data);
      pageNum += 1;
    }
    return results;
  };

  // Date getter (handles splits)
  const getItemDate = (item) =>
    new Date(
      item?.attributes?.date ||
        item?.attributes?.transactions?.[0]?.date ||
        item?.attributes?.created_at ||
        0
    );

  // Amount getter (pick first split if present)
  const getItemAmount = (item) => {
    const attrs = item?.attributes || {};
    const tx = attrs.transactions?.[0] || {};
    const amt = parseFloat(tx.amount ?? attrs.amount ?? "0");
    return isNaN(amt) ? 0 : amt;
  };

  // Type getter
  const getItemType = (item) => {
    const attrs = item?.attributes || {};
    const tx = attrs.transactions?.[0] || {};
    return (attrs.type || tx.type || "").toLowerCase();
  };

  // Description getter
  const getItemDesc = (item) => {
    const attrs = item?.attributes || {};
    const tx = attrs.transactions?.[0] || {};
    return (attrs.description || tx.description || "No description").toString();
  };

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        setLoading(true);
        setPage(1); // reset to first page on new payload

        const config = await getAuthConfig();
        let merged = [];

        if (payload.reportType === "transaction") {
          const hasAccounts =
            Array.isArray(payload.accounts) && payload.accounts.length > 0;

          if (hasAccounts) {
            // Try single API call with multiple accounts (preferred)
            const ids = payload.accounts.map((a) =>
              encodeURIComponent(typeof a === "object" ? a.id : a)
            );
            const accountsQuery = ids.map((id) => `accounts[]=${id}`).join("&");
            const baseUrl = `transactions?start=${payload.start}&end=${payload.end}&${accountsQuery}`;

            try {
              merged = await fetchAllPages(baseUrl, config);
            } catch (e) {
              // Fallback: fetch each account separately and merge
              const perAccount = await Promise.all(
                payload.accounts.map(async (acc) => {
                  const accId = typeof acc === "object" ? acc.id : acc;
                  const base = `accounts/${accId}/transactions?start=${payload.start}&end=${payload.end}`;
                  return await fetchAllPages(base, config);
                })
              );
              merged = perAccount.flat();
            }
          } else {
            // All accounts
            const baseUrl = `transactions?start=${payload.start}&end=${payload.end}`;
            merged = await fetchAllPages(baseUrl, config);
          }
        } else if (
          payload.reportType === "category" &&
          Array.isArray(payload.categories) &&
          payload.categories.length > 0
        ) {
          // categories combined request
          const ids = payload.categories.map((c) => c.id).join(",");
          const baseUrl = `categories/${ids}/transactions?start=${payload.start}&end=${payload.end}`;
          merged = await fetchAllPages(baseUrl, config);
        } else if (
          payload.reportType === "tag" &&
          Array.isArray(payload.tags) &&
          payload.tags.length > 0
        ) {
          const ids = payload.tags.map((t) => t.id).join(",");
          const baseUrl = `tags/${ids}/transactions?start=${payload.start}&end=${payload.end}`;
          merged = await fetchAllPages(baseUrl, config);
        } else {
          // Fallback: nothing selected -> empty
          merged = [];
        }

        // Global sort by date DESC so entries interleave across accounts
        merged.sort((a, b) => getItemDate(b) - getItemDate(a));

        if (isActive) setAllTx(merged);
      } catch (err) {
        console.error("❌ Error fetching report data:", err?.message);
        if (isActive) setAllTx([]);
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [payload]);

  // Apply filters locally on the full dataset
  const filteredTx = useMemo(() => {
    const s = searchText.trim().toLowerCase();
    const min = minAmount ? parseFloat(minAmount) : null;
    const max = maxAmount ? parseFloat(maxAmount) : null;
    const type = typeFilter.toLowerCase();

    return allTx.filter((item) => {
      const desc = getItemDesc(item).toLowerCase();
      const amt = getItemAmount(item);
      const t = getItemType(item);

      if (s && !desc.includes(s)) return false;
      if (min !== null && amt < min) return false;
      if (max !== null && amt > max) return false;
      if (type !== "all" && t !== type) return false;

      return true;
    });
  }, [allTx, searchText, minAmount, maxAmount, typeFilter]);

  // Client-side pagination over filtered list
  const totalPages = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTx.slice(start, start + PAGE_SIZE);
  }, [filteredTx, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchText, minAmount, maxAmount, typeFilter]);

  const renderTransaction = ({ item }) => {
    const attrs = item.attributes || {};
    const tx = attrs.transactions?.[0] || {};

    const description = getItemDesc(item);
    const type = getItemType(item) || "unknown";
    const amount = getItemAmount(item);
    const currency = tx.currency_code || attrs.currency_code || "₹";
    const date = getItemDate(item);

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
            {isNaN(date.getTime()) ? "N/A" : date.toDateString()}
          </Text>
          <Text
            style={[
              styles.txAmount,
              type === "withdrawal" ? styles.debit : styles.credit,
            ]}
          >
            {currency} {amount.toFixed(2)}
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
      range.push(totalPages);

      return range;
    };

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
          onPress={() => page > 1 && setPage(page - 1)}
          disabled={page === 1}
        >
          <Text style={styles.pageText}>Prev</Text>
        </TouchableOpacity>

        {getPages().map((p, idx) => (
          <TouchableOpacity
            key={`p-${p}-${idx}`}
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

        <TouchableOpacity
          style={[
            styles.pageBtn,
            page === totalPages && styles.pageBtnDisabled,
          ]}
          onPress={() => page < totalPages && setPage(page + 1)}
          disabled={page === totalPages}
        >
          <Text style={styles.pageText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View className="header" style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Results</Text>
        <ThreeDotMenu />
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search description..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TextInput
          style={styles.amountInput}
          placeholder="Min"
          keyboardType="numeric"
          value={minAmount}
          onChangeText={setMinAmount}
        />
        <TextInput
          style={styles.amountInput}
          placeholder="Max"
          keyboardType="numeric"
          value={maxAmount}
          onChangeText={setMaxAmount}
        />
      </View>

      <View style={styles.typeFilter}>
        {["all", "deposit", "transfer", "withdrawal"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.typeBtn,
              typeFilter === t && styles.typeBtnActive,
            ]}
            onPress={() => setTypeFilter(t)}
          >
            <Text
              style={[
                styles.typeBtnText,
                typeFilter === t && styles.typeBtnTextActive,
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : !pageItems.length ? (
        <View style={styles.loader}>
          <Text style={{ color: "#fff" }}>No results found.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={pageItems}
            keyExtractor={(item, index) =>
              `${item.id}-${item.attributes?.transaction_journal_id || index}`
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

  // Filters
  filterBar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#eee",
    borderRadius: 6,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  amountInput: {
    width: 70,
    backgroundColor: "#eee",
    borderRadius: 6,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  typeFilter: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  typeBtnActive: { backgroundColor: "#2196F3" },
  typeBtnText: { color: "#2196F3", fontWeight: "bold" },
  typeBtnTextActive: { color: "#fff" },

  // Pagination
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 6,
  },
  pageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageText: { color: "#2196F3", fontWeight: "bold" },
  activePageBtn: { backgroundColor: "#2196F3" },
  activePageText: { color: "#fff" },
});
