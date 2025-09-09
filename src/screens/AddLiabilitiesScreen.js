import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import Footer from "../components/Footer";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function AddLiabilitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const account = route.params?.account || null; // If editing, account is passed
  const onSaved = route.params?.onSaved; // Callback to refresh list

  const isEdit = !!account;

  const [name, setName] = useState(account?.name || "");
  const [currency, setCurrency] = useState(account?.currency_code || "INR");
  const [liabilityType, setLiabilityType] = useState(account?.liability_type || "debt");
  const [liabilityDirection, setLiabilityDirection] = useState(account?.liability_direction || "debit");
  const [amount, setAmount] = useState(
    account?.current_balance != null ? Math.abs(account.current_balance).toString() : ""
  );
  const [startDate, setStartDate] = useState(
    account?.opening_balance_date ? new Date(account.opening_balance_date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [interest, setInterest] = useState(account?.interest?.toString() || "");
  const [interestPeriod, setInterestPeriod] = useState(account?.interest_period || "monthly");

  const handleSave = async () => {
    try {
      const numericAmount = parseFloat(amount) || 0;
      const openingBalance =
        liabilityDirection === "debit" ? -Math.abs(numericAmount) : Math.abs(numericAmount);

      const payload = {
        name: name || "Liability @" + new Date().toISOString(),
        type: "liability",
        currency_code: currency,
        opening_balance: openingBalance.toFixed(2),
        opening_balance_date: moment(startDate).format("YYYY-MM-DD"),
        liability_type: liabilityType,
        liability_direction: liabilityDirection,
      };

      if (interest) {
        payload.interest = parseFloat(interest);
        payload.interest_period = interestPeriod || "monthly";
      }

      const config = await getAuthConfig();

      if (isEdit) {
        // Firefly III requires POST for editing with /accounts/{id}/save
        await axios.post(`${config.baseURL}/accounts/${account.id}/save`, payload, config);
        Alert.alert("Success", "Liability updated successfully!");
      } else {
        await axios.post(`${config.baseURL}/accounts`, payload, config);
        Alert.alert("Success", "Liability created successfully!");
      }

      if (onSaved) onSaved(); // Refresh liabilities list
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error saving liability:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save liability"
      );
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this liability?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const config = await getAuthConfig();
              await axios.delete(`${config.baseURL}/accounts/${account.id}`, config);
              Alert.alert("Deleted", "Liability deleted successfully!");
              if (onSaved) onSaved(); // Refresh list
              navigation.goBack();
            } catch (error) {
              console.error("❌ Error deleting liability:", error.response?.data || error.message);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete liability"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconWrapper}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Liability" : "Add Liability"}</Text>
        <ThreeDotMenu />
      </View>

      {/* Body */}
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Currency *</Text>
        <TextInput style={styles.input} value={currency} onChangeText={setCurrency} />

        <Text style={styles.label}>Liability Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={liabilityType} onValueChange={setLiabilityType} style={styles.picker}>
            <Picker.Item label="Debt" value="debt" />
            <Picker.Item label="Loan" value="loan" />
            <Picker.Item label="Mortgage" value="mortgage" />
          </Picker>
        </View>

        <Text style={styles.label}>Liability Direction *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={liabilityDirection}
            onValueChange={setLiabilityDirection}
            style={styles.picker}
          >
            <Picker.Item label="I owe this debt" value="debit" />
            <Picker.Item label="I am owed this debt" value="credit" />
          </Picker>
        </View>

        <Text style={styles.label}>Amount *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{moment(startDate).format("YYYY-MM-DD")}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.label}>Interest</Text>
        <TextInput style={styles.input} value={interest} onChangeText={setInterest} keyboardType="numeric" />

        <Text style={styles.label}>Interest Period</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={interestPeriod} onValueChange={setInterestPeriod} style={styles.picker}>
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Yearly" value="yearly" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{isEdit ? "Edit Liability" : "Create Liability"}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete Liability</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  headerIconWrapper: { width: 40, alignItems: "flex-start" },
  headerIcon: { color: "#fff", fontSize: 22 },
  headerTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 20, fontWeight: "bold" },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 15 },
  picker: { height: 50, width: "100%" },
  dateButton: { padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8, marginBottom: 15 },
  dateText: { fontSize: 16 },
  button: { backgroundColor: "#2196F3", padding: 15, borderRadius: 8, marginBottom: 10 },
  deleteButton: { backgroundColor: "#FF5722" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
