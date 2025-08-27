// LiabilitiesScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import Footer from "../components/Footer";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function LiabilitiesScreen() {
  const navigation = useNavigation();
  const [liabilities, setLiabilities] = useState([]);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLiabilities = async () => {
    try {
      setLoading(true);
      const config = await getAuthConfig();
      const res = await axios.get("accounts?type=liability&with_current_balance=true", config);

      const liabData = (res.data?.data || []).map(acc => ({
        id: acc.id,
        name: acc.attributes?.name || "Unnamed Liability",
        balance: parseFloat(acc.attributes?.current_balance) || 0
      }));

      setLiabilities(liabData);
      setTotalLiabilities(liabData.reduce((sum, l) => sum + l.balance, 0));
    } catch (error) {
      console.error("fetchLiabilities error", error);
      setLiabilities([]);
      setTotalLiabilities(0);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLiabilities();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLiabilities();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemBalance}>Balance: {item.balance}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liabilities</Text>
        {/* ✅ Use ThreeDotMenu */}
                  <ThreeDotMenu />
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate("AddLiabilityScreen")}
      >
        <Text style={styles.addBtnText}>+ Add New Liability</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={liabilities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total Liabilities: {totalLiabilities}</Text>
            </View>
          }
        />
      )}

      {/* Footer */}
      <SafeAreaView edges={["bottom"]}>
        <Footer />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerIcon: { color: "#fff", fontSize: 22 },
  addBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  addBtnText: { color: "white", textAlign: "center", fontWeight: "bold" },
  listItem: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 10,
  },
  itemName: { fontWeight: "bold", fontSize: 16 },
  itemBalance: { fontSize: 14, marginTop: 4 },
  totalContainer: {
    padding: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  totalText: { fontWeight: "bold", fontSize: 16 },
});
