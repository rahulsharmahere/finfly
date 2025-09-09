import React, { useState } from "react";
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

export default function AddAssetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editingAccount = route.params?.account || null;

  const [name, setName] = useState(editingAccount?.name || "");
  const [accountNumber, setAccountNumber] = useState(editingAccount?.account_number || "");
  const [openingBalance, setOpeningBalance] = useState(editingAccount?.opening_balance?.toString() || "");
  const [openingBalanceDate, setOpeningBalanceDate] = useState(
    editingAccount?.opening_balance_date ? new Date(editingAccount.opening_balance_date) : new Date()
  );
  const [accountRole, setAccountRole] = useState(editingAccount?.account_role || "defaultAsset");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditMode = !!editingAccount;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter account name.");
      return;
    }

    try {
      const payload = {
        name,
        type: "asset",
        account_number: accountNumber,
        account_role: accountRole,
        opening_balance: openingBalance || "0",
        opening_balance_date: moment(openingBalanceDate).format("YYYY-MM-DD"),
      };

      const config = await getAuthConfig();

      if (isEditMode) {
        // Delete old account first
        await axios.delete(`accounts/${editingAccount.id}`, config);
      }

      // Create new account
      await axios.post("accounts", payload, config);

      Alert.alert("Success", `Account ${isEditMode ? "updated" : "created"} successfully!`);
      navigation.goBack();
    } catch (err) {
      console.error("❌ Error saving account:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Failed to save account");
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    try {
      const config = await getAuthConfig();
      await axios.delete(`accounts/${editingAccount.id}`, config);
      Alert.alert("Deleted", "Account deleted successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("❌ Error deleting account:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to delete account");
    }
  };

  const resetForm = () => {
    setName("");
    setAccountNumber("");
    setOpeningBalance("");
    setOpeningBalanceDate(new Date());
    setAccountRole("defaultAsset");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconWrapper}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Asset Account" : "Add Asset Account"}
        </Text>

        <ThreeDotMenu />
      </View>

      {/* Body */}
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Account Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Account Number (optional)</Text>
        <TextInput
          style={styles.input}
          value={accountNumber}
          onChangeText={setAccountNumber}
        />

        <Text style={styles.label}>Opening Balance</Text>
        <TextInput
          style={styles.input}
          value={openingBalance}
          onChangeText={setOpeningBalance}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Opening Balance Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {moment(openingBalanceDate).format("YYYY-MM-DD")}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={openingBalanceDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setOpeningBalanceDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.label}>Account Role *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={accountRole}
            onValueChange={setAccountRole}
            style={styles.picker}
          >
            <Picker.Item label="Default Asset" value="defaultAsset" />
            <Picker.Item label="Shared Asset" value="sharedAsset" />
            <Picker.Item label="Saving Asset" value="savingAsset" />
            <Picker.Item label="Credit Card Asset" value="ccAsset" />
            <Picker.Item label="Cash Wallet" value="cashWalletAsset" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>
            {isEditMode ? "Update Account" : "Create Account"}
          </Text>
        </TouchableOpacity>

        {isEditMode ? (
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>Delete Account</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetForm}
          >
            <Text style={styles.buttonText}>Reset Form</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#2196F3", padding: 12 },
  headerIconWrapper: { width: 40, alignItems: "flex-start" },
  headerIcon: { color: "#fff", fontSize: 22 },
  headerTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 20, fontWeight: "bold" },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15 },
  dateButton: { padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8, marginBottom: 15 },
  dateText: { fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 20 },
  picker: { height: 50, width: "100%" },
  button: { backgroundColor: "#2196F3", padding: 15, borderRadius: 8, marginBottom: 10 },
  resetButton: { backgroundColor: "#FF5722" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
