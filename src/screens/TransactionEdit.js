// src/screens/TransactionEdit.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import moment from "moment";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getAuthConfig } from "../utils/fireflyApi";
import axios from "axios";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import ThreeDotMenu from "../components/ThreeDotMenu";

const TYPE_OPTIONS = ["deposit", "withdrawal", "transfer"];

export default function TransactionEdit() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  // Fetching state
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Transaction fields
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");

  const [sourceName, setSourceName] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [budgetName, setBudgetName] = useState("");
  const [billName, setBillName] = useState("");
  const [notes, setNotes] = useState("");

  // Tags input (comma separated string) + suggestions
  const [tagsInput, setTagsInput] = useState("");

  // Suggestion data from API
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tagsMaster, setTagsMaster] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);

  // Show/hide suggestion dropdowns
  const [showSourceSug, setShowSourceSug] = useState(false);
  const [showDestSug, setShowDestSug] = useState(false);
  const [showCatSug, setShowCatSug] = useState(false);
  const [showBudgetSug, setShowBudgetSug] = useState(false);
  const [showBillSug, setShowBillSug] = useState(false);
  const [showTagSug, setShowTagSug] = useState(false);

  // --------- Load suggestions ----------
  useEffect(() => {
    (async () => {
      try {
        const config = await getAuthConfig();
        const [accRes, catRes, tagRes, budgetRes, billRes] = await Promise.all([
          axios.get("accounts", config),
          axios.get("categories", config),
          axios.get("tags", config),
          axios.get("budgets", config),
          axios.get("bills", config),
        ]);

        const accList =
          accRes.data?.data
            ?.filter((a) => {
              const type = a.attributes.account_type || a.attributes.type;
              const subtype = (a.attributes.subtype || "").toLowerCase();
              const name = (a.attributes.name || "").toLowerCase();
              const okType =
                type === "asset" || type === "liability" || type === "liabilities";
              const badSubtype = ["initial-balance", "revenue", "expense", "import"];
              const excluded =
                badSubtype.includes(subtype) || name.includes("initial balance");
              return okType && !excluded;
            })
            .map((a) => a.attributes.name) || [];

        setAccounts(accList);
        setCategories(catRes.data?.data?.map((c) => c.attributes.name) || []);
        setTagsMaster(tagRes.data?.data?.map((t) => t.attributes.tag).filter(Boolean) || []);
        setBudgets(budgetRes.data?.data?.map((b) => b.attributes.name) || []);
        setBills(billRes.data?.data?.map((b) => b.attributes.name) || []);
      } catch (e) {
        console.error("Failed to fetch suggestion data:", e?.message);
      }
    })();
  }, []);

  // --------- Load one transaction (edit mode) ----------
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const config = await getAuthConfig();
        const res = await axios.get(`transactions/${id}`, config);

        const tx = res?.data?.data;
        const line =
          Array.isArray(tx?.attributes?.transactions) &&
          tx.attributes.transactions.length > 0
            ? tx.attributes.transactions[0]
            : {};

        setDate(line.date ? moment(line.date).toDate() : new Date());
        setDescription(line.description || "");
        setAmount(line.amount ? String(Number(line.amount)) : "");
        setType(line.type || "deposit");
        setSourceName(line.source_name || "");
        setDestinationName(line.destination_name || "");
        setCategoryName(line.category_name || "");
        setBudgetName(line.budget_name || "");
        setBillName(line.bill_name || "");
        setNotes(line.notes || "");
        setTagsInput((line.tags || []).join(", "));
      } catch (e) {
        console.error("Failed to fetch transaction:", e?.message);
        setError("Failed to fetch transaction.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // --------- Derived suggestions (limited & case-insensitive) ----------
  const filterText = (s) => (s || "").toLowerCase();
  const top = (arr) => arr.slice(0, 8);

  const srcMatches = useMemo(
    () => top(accounts.filter((n) => n.toLowerCase().includes(filterText(sourceName)))),
    [accounts, sourceName]
  );
  const dstMatches = useMemo(
    () => top(accounts.filter((n) => n.toLowerCase().includes(filterText(destinationName)))),
    [accounts, destinationName]
  );
  const catMatches = useMemo(
    () => top(categories.filter((n) => n.toLowerCase().includes(filterText(categoryName)))),
    [categories, categoryName]
  );
  const budgetMatches = useMemo(
    () => top(budgets.filter((n) => n.toLowerCase().includes(filterText(budgetName)))),
    [budgets, budgetName]
  );
  const billMatches = useMemo(
    () => top(bills.filter((n) => n.toLowerCase().includes(filterText(billName)))),
    [bills, billName]
  );

  // Tag suggestions for the **last** token
  const lastTagTerm = useMemo(() => {
    const parts = tagsInput.split(",").map((t) => t.trim());
    return parts.length ? parts[parts.length - 1] : "";
  }, [tagsInput]);

  const tagMatches = useMemo(() => {
    if (!lastTagTerm) return [];
    const term = lastTagTerm.toLowerCase();
    return top(tagsMaster.filter((t) => t.toLowerCase().includes(term)));
  }, [tagsMaster, lastTagTerm]);

  // --------- Save / Delete ----------
  const onSave = async () => {
    if (!amount || Number.isNaN(Number(amount))) {
      Toast.show({ type: "error", text1: "Please enter a valid amount." });
      return;
    }
    // Required fields depending on type
    if (type === "deposit" && !destinationName) {
      Toast.show({ type: "error", text1: "Destination account is required for Deposit." });
      return;
    }
    if (type === "withdrawal" && !sourceName) {
      Toast.show({ type: "error", text1: "Source account is required for Withdrawal." });
      return;
    }
    if (type === "transfer" && (!sourceName || !destinationName)) {
      Toast.show({ type: "error", text1: "Source & Destination are required for Transfer." });
      return;
    }

    try {
      setSaving(true);
      const config = await getAuthConfig();

      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        transactions: [
          {
            description,
            date: moment(date).format("YYYY-MM-DD HH:mm:ss"),
            amount: Number(amount).toFixed(2).toString(),
            type,
            source_name: sourceName || undefined,
            destination_name: destinationName || undefined,
            category_name: categoryName || undefined,
            budget_name: budgetName || undefined,
            bill_name: billName || undefined,
            notes: notes || undefined,
            tags: tagsArray,
          },
        ],
      };

      if (id) {
        await axios.put(`transactions/${id}`, payload, config);
        Toast.show({ type: "success", text1: "Transaction updated" });
      } else {
        await axios.post("transactions", payload, config);
        Toast.show({ type: "success", text1: "Transaction created" });
      }
      navigation.goBack();
    } catch (e) {
      console.error("Save error:", e?.response?.data || e?.message);
      Toast.show({ type: "error", text1: "Failed to save transaction" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const config = await getAuthConfig();
      await axios.delete(`transactions/${id}`, config);
      Toast.show({ type: "success", text1: "Transaction deleted" });
      navigation.goBack();
    } catch (e) {
      console.error("Delete error:", e?.message);
      Toast.show({ type: "error", text1: "Failed to delete transaction" });
    } finally {
      setDeleting(false);
    }
  };

  // --------- UI States ----------
  if (loading || saving || deleting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>
          {loading ? "Loading..." : saving ? "Saving..." : "Deleting..."}
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  // --------- Render ----------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Blue Header (match Dashboard) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id ? "Edit Transaction" : "New Transaction"}</Text>
        <ThreeDotMenu />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Date / Time */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{moment(date).format("YYYY-MM-DD")}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) {
                const nd = new Date(date);
                nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                setDate(nd);
              }
            }}
          />
        )}

        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>{moment(date).format("HH:mm")}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={(_, t) => {
              setShowTimePicker(false);
              if (t) {
                const nd = new Date(date);
                nd.setHours(t.getHours(), t.getMinutes());
                setDate(nd);
              }
            }}
          />
        )}

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => {
            let clean = text.replace(/[^0-9.]/g, "");
            const dots = (clean.match(/\./g) || []).length;
            if (dots > 1) clean = clean.slice(0, -1);
            if (clean.includes(".")) {
              const [i, d] = clean.split(".");
              clean = i + "." + (d || "").slice(0, 2);
            }
            setAmount(clean);
          }}
        />

        {/* Type */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Source / Destination */}
        <Text style={styles.label}>Source Account{type === "withdrawal" || type === "transfer" ? " *" : ""}</Text>
        <TextInput
          style={styles.input}
          placeholder="Type to search..."
          value={sourceName}
          onFocus={() => setShowSourceSug(true)}
          onBlur={() => setShowSourceSug(false)}
          onChangeText={(v) => {
            setSourceName(v);
            setShowSourceSug(true);
          }}
        />
        {showSourceSug && sourceName.length > 0 && (
          <View style={styles.suggestBox}>
            {srcMatches.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setSourceName(item);
                  setShowSourceSug(false);
                }}
              >
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>
          Destination Account{type === "deposit" || type === "transfer" ? " *" : ""}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type to search..."
          value={destinationName}
          onFocus={() => setShowDestSug(true)}
          onBlur={() => setShowDestSug(false)}
          onChangeText={(v) => {
            setDestinationName(v);
            setShowDestSug(true);
          }}
        />
        {showDestSug && destinationName.length > 0 && (
          <View style={styles.suggestBox}>
            {dstMatches.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setDestinationName(item);
                  setShowDestSug(false);
                }}
              >
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Type to search..."
          value={categoryName}
          onFocus={() => setShowCatSug(true)}
          onBlur={() => setShowCatSug(false)}
          onChangeText={(v) => {
            setCategoryName(v);
            setShowCatSug(true);
          }}
        />
        {showCatSug && categoryName.length > 0 && (
          <View style={styles.suggestBox}>
            {catMatches.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setCategoryName(item);
                  setShowCatSug(false);
                }}
              >
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Budget */}
        <Text style={styles.label}>Budget</Text>
        <TextInput
          style={styles.input}
          placeholder="Type to search..."
          value={budgetName}
          onFocus={() => setShowBudgetSug(true)}
          onBlur={() => setShowBudgetSug(false)}
          onChangeText={(v) => {
            setBudgetName(v);
            setShowBudgetSug(true);
          }}
        />
        {showBudgetSug && budgetName.length > 0 && (
          <View style={styles.suggestBox}>
            {budgetMatches.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setBudgetName(item);
                  setShowBudgetSug(false);
                }}
              >
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bill */}
        <Text style={styles.label}>Bill</Text>
        <TextInput
          style={styles.input}
          placeholder="Type to search..."
          value={billName}
          onFocus={() => setShowBillSug(true)}
          onBlur={() => setShowBillSug(false)}
          onChangeText={(v) => {
            setBillName(v);
            setShowBillSug(true);
          }}
        />
        {showBillSug && billName.length > 0 && (
          <View style={styles.suggestBox}>
            {billMatches.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setBillName(item);
                  setShowBillSug(false);
                }}
              >
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tags with auto-suggest for the **last** token */}
        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. groceries, salary"
          value={tagsInput}
          onFocus={() => setShowTagSug(true)}
          onBlur={() => setShowTagSug(false)}
          onChangeText={(v) => {
            setTagsInput(v);
            setShowTagSug(true);
          }}
        />
        {showTagSug && lastTagTerm.length > 0 && tagMatches.length > 0 && (
          <View style={styles.suggestBox}>
            {tagMatches.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  const parts = tagsInput.split(",").map((t) => t.trim());
                  // Replace last term with selected tag
                  if (parts.length === 0) parts.push(item);
                  else {
                    parts[parts.length - 1] = item;
                  }
                  // Remove duplicates, keep order
                  const uniq = [];
                  for (const p of parts) if (p && !uniq.includes(p)) uniq.push(p);
                  setTagsInput(uniq.join(", ") + ", ");
                  setShowTagSug(false);
                }}
              >
                <Text style={styles.suggestion}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={onSave}>
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {id ? (
          <TouchableOpacity style={[styles.deleteBtn]} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete Transaction</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Header (blue, like Dashboard)
  header: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerIcon: { color: "#fff", fontSize: 22 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  content: { padding: 16, backgroundColor: "#f5f5f5" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  label: { fontWeight: "bold", marginTop: 14, marginBottom: 6, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  typeBtnActive: {
    backgroundColor: "#2196F3",
  },
  typeText: { color: "#2196F3", fontWeight: "700" },
  typeTextActive: { color: "#fff" },

  suggestBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginTop: 4,
    overflow: "hidden",
  },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtn: { backgroundColor: "#007AFF" },
  cancelBtn: { backgroundColor: "#999" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  deleteBtn: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ff3b30",
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontWeight: "700" },
});
