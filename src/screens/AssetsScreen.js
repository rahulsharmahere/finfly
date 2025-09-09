import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import { fetchActualBalance } from "../utils/fireflyBalances";
import Footer from "../components/Footer";
import ThreeDotMenu from "../components/ThreeDotMenu";
import Icon from "react-native-vector-icons/Ionicons";

export default function AssetsScreen() {
  const navigation = useNavigation();
  const [assets, setAssets] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const config = await getAuthConfig();
      const res = await axios.get("accounts?type=asset", config);
      const assetData = res.data?.data || [];

      // Fetch correct balance for each account
      const balances = await Promise.all(
        assetData.map(async (acc) => {
          const balance = await fetchActualBalance(acc.id);
          return {
            id: acc.id,
            name: acc.attributes?.name || "Unnamed Asset",
            balance,
            ...acc.attributes,
          };
        })
      );

      setAssets(balances);
      setTotalAssets(balances.reduce((sum, a) => sum + a.balance, 0));
    } catch (error) {
      console.error("fetchAssets error", error);
      setAssets([]);
      setTotalAssets(0);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssets();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBalance}>
          Balance: {item.balance.toFixed(2)}
        </Text>
      </View>
      {/* Navigate to AddAssetScreen with account for editing */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("AddAssetScreen", { account: item })
        }
      >
        <Icon name="pencil" size={22} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assets</Text>
          <ThreeDotMenu />
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 150 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate("AddAssetScreen")}
              >
                <Text style={styles.addBtnText}>+ Add New Asset</Text>
              </TouchableOpacity>
            }
            ListFooterComponent={
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>
                  Total Assets: {totalAssets.toFixed(2)}
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.footerWrapper}>
          <Footer />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 10 },
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  totalText: { fontWeight: "bold", fontSize: 16 },
  footerWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },
});
