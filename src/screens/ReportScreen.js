import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";
import SectionedMultiSelect from "react-native-sectioned-multi-select";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function ReportScreen() {
  const navigation = useNavigation();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState("transaction");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [dateRange, setDateRange] = useState("30days");

  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = await getAuthConfig();

        const [accRes, catRes, tagRes] = await Promise.all([
          axios.get(
            "accounts?types=asset,liability&with_current_balance=true",
            config
          ),
          axios.get("categories", config),
          axios.get("tags", config),
        ]);

        const allAccounts = Array.isArray(accRes.data?.data) ? accRes.data.data : [];
const onlyAssetAndLiability = allAccounts.filter((a) => {
  const t = (a.attributes?.type || "").toLowerCase();
  return t === "asset" || t === "liability";
});
setAccounts(onlyAssetAndLiability);

        setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setTags(Array.isArray(tagRes.data?.data) ? tagRes.data.data : []);
      } catch (e) {
        console.error("Error fetching report data:", e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const computeDateRange = () => {
    const now = new Date();
    let start, end;

    if (dateRange === "30days") {
      end = now;
      start = new Date();
      start.setDate(now.getDate() - 30);
    } else if (dateRange === "6months") {
      end = now;
      start = new Date();
      start.setMonth(now.getMonth() - 6);
    } else if (dateRange === "ytd") {
      end = now;
      start = new Date(now.getFullYear(), 0, 1);
    } else if (dateRange === "custom") {
      start = customStartDate;
      end = customEndDate;
    } else {
      start = new Date();
      start.setDate(now.getDate() - 30);
      end = now;
    }

    return {
      start: start ? start.toISOString().split("T")[0] : null,
      end: end ? end.toISOString().split("T")[0] : null,
    };
  };

  const handleGenerate = () => {
    const { start, end } = computeDateRange();

    const selectedAccounts = selectedAccountIds.map((id) => {
      const a = accounts.find((acc) => acc.id === id);
      return { id, name: a?.attributes?.name || "" };
    });

    const selectedCategories = selectedCategoryIds.map((id) => {
      const c = categories.find((cat) => cat.id === id);
      return { id, name: c?.attributes?.name || "" };
    });

    const selectedTags = selectedTagIds.map((id) => {
      const t = tags.find((tag) => tag.id === id);
      return { id, name: t?.attributes?.tag || "" };
    });

    navigation.navigate("ReportResultScreen", {
      payload: {
        reportType,
        accounts: selectedAccounts,
        categories: selectedCategories,
        tags: selectedTags,
        start,
        end,
      },
    });
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );

  const formatItems = (items, key = "name") => {
    return items.map((i) => ({
      id: i.id,
      name: i.attributes?.[key] || i.attributes?.tag,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <ThreeDotMenu />
        </View>

        {/* Report Type */}
        <Text style={styles.label}>Report Type</Text>
        <SectionedMultiSelect
          items={[
            { id: "transaction", name: "Transaction Report" },
            { id: "category", name: "By Category" },
            { id: "tag", name: "By Tag" },
          ]}
          uniqueKey="id"
          selectText="Select Report Type"
          single={true}
          IconRenderer={Icon}
          onSelectedItemsChange={(val) => setReportType(val[0] || "transaction")}
          selectedItems={[reportType]}
        />

        {/* Accounts */}
        <Text style={styles.label}>Accounts</Text>
        <SectionedMultiSelect
          items={formatItems(accounts)}
          uniqueKey="id"
          selectText="Select Accounts"
          IconRenderer={Icon}
          onSelectedItemsChange={setSelectedAccountIds}
          selectedItems={selectedAccountIds}
        />

        {/* Date Range */}
        <Text style={styles.label}>Date Range</Text>
        <SectionedMultiSelect
          items={[
            { id: "30days", name: "Last 30 Days" },
            { id: "6months", name: "Last 6 Months" },
            { id: "ytd", name: "Year to Date" },
            { id: "custom", name: "Custom" },
          ]}
          uniqueKey="id"
          selectText="Select Date Range"
          single={true}
          IconRenderer={Icon}
          onSelectedItemsChange={(val) => setDateRange(val[0] || "30days")}
          selectedItems={[dateRange]}
        />

        {dateRange === "custom" && (
          <>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowStartPicker(true)}
            >
              <Text>
                {customStartDate?.toDateString() || "Select Start Date"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showStartPicker}
              mode="date"
              onConfirm={(date) => {
                setCustomStartDate(date);
                setShowStartPicker(false);
              }}
              onCancel={() => setShowStartPicker(false)}
            />

            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowEndPicker(true)}
            >
              <Text>{customEndDate?.toDateString() || "Select End Date"}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showEndPicker}
              mode="date"
              onConfirm={(date) => {
                setCustomEndDate(date);
                setShowEndPicker(false);
              }}
              onCancel={() => setShowEndPicker(false)}
            />
          </>
        )}

        {/* Categories */}
        {reportType === "category" && (
          <>
            <Text style={styles.label}>Categories</Text>
            <SectionedMultiSelect
              items={formatItems(categories)}
              uniqueKey="id"
              selectText="Select Categories"
              IconRenderer={Icon}
              onSelectedItemsChange={setSelectedCategoryIds}
              selectedItems={selectedCategoryIds}
            />
          </>
        )}

        {/* Tags */}
        {reportType === "tag" && (
          <>
            <Text style={styles.label}>Tags</Text>
            <SectionedMultiSelect
              items={formatItems(tags, "tag")}
              uniqueKey="id"
              selectText="Select Tags"
              IconRenderer={Icon}
              onSelectedItemsChange={setSelectedTagIds}
              selectedItems={selectedTagIds}
            />
          </>
        )}

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Text style={styles.generateBtnText}>Generate Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  backBtn: { padding: 4 },
  backIcon: { color: "#fff", fontSize: 22 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5 },
  dateBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  generateBtn: {
    marginTop: 30,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
});
