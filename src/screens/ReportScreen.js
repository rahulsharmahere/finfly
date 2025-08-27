import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { VictoryChart, VictoryLine, VictoryTheme } from "victory-native";
import { fetchTransactionsSummary , fetchLatestTransactions } from "../utils/fireflyApi";
import Ionicons from "react-native-vector-icons/Ionicons";

const ReportScreen = ({ navigation }) => {
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        // Load income/expense
        const data = await fetchTransactionsSummary("2025-01-01", "2025-12-31");
        setChartData(data);

        // Load latest transactions
        const tx = await fetchLatestTransactions(10);
        setTransactions(tx);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const renderMenu = () => {
    if (!menuVisible) return null;
    return (
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text>Share</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <TouchableOpacity onPress={toggleMenu}>
          <MaterialIcons name="more-vert" size={28} color="#333" />
        </TouchableOpacity>
        {renderMenu()}
      </View>

      {/* Report Content */}
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <View style={styles.content}>
          {/* Income vs Expense chart */}
          <VictoryChart theme={VictoryTheme.material}>
            <VictoryLine
              data={chartData}
              x="date"
              y="income"
              style={{ data: { stroke: "green" } }}
            />
            <VictoryLine
              data={chartData}
              x="date"
              y="expense"
              style={{ data: { stroke: "red" } }}
            />
          </VictoryChart>

          {/* Transactions Preview */}
          <Text style={styles.sectionTitle}>Latest Transactions</Text>
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.transaction}>
                <Text>{item.description}</Text>
                <Text
                  style={{ color: item.type === "withdrawal" ? "red" : "green" }}
                >
                  ₹ {item.amount.toFixed(2)}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  menu: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    elevation: 5,
    padding: 8,
  },
  menuItem: { paddingVertical: 6, paddingHorizontal: 12 },
  loading: { textAlign: "center", marginTop: 20 },
  content: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  transaction: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default ReportScreen;
