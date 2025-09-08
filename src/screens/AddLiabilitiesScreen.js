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
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";
import Footer from "../components/Footer";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function AddLiabilitiesScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR"); // default
  const [liabilityType, setLiabilityType] = useState("debt"); // debt/loan/mortgage
  const [liabilityDirection, setLiabilityDirection] = useState("debit"); // debit/credit
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [interest, setInterest] = useState("");
  const [interestPeriod, setInterestPeriod] = useState("monthly");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter liability name.");
      return;
    }

    if (!liabilityType) {
      Alert.alert("Validation Error", "Please select liability type.");
      return;
    }

    if (!liabilityDirection) {
      Alert.alert("Validation Error", "Please select liability direction.");
      return;
    }

    try {
      const config = await getAuthConfig();

      const payload = {
        data: {
          type: "accounts",
          attributes: {
            type: "liability",
            name,
            currency,
            account_role: "defaultLiability",
            liability_type: liabilityType,
            liability_direction: liabilityDirection,
            opening_balance: amount || "0",
            opening_balance_date: moment(startDate).format("YYYY-MM-DD"),
            interest: interest || "0",
            interest_period: interestPeriod,
          },
        },
      };

      const res = await axios.post("/accounts", payload, config);

      Alert.alert("Success", "Liability created successfully!");
      resetForm();
      navigation.goBack();
    } catch (err) {
      console.error("❌ Error creating liability:", err.response?.data || err.message);
      Alert.alert("Error", JSON.stringify(err.response?.data || err.message));
    }
  };

  const resetForm = () => {
    setName("");
    setCurrency("INR");
    setLiabilityType("debt");
    setLiabilityDirection("debit");
    setAmount("");
    setStartDate(new Date());
    setInterest("");
    setInterestPeriod("monthly");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconWrapper}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Liability</Text>
        <ThreeDotMenu />
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Currency *</Text>
        <TextInput style={styles.input} value={currency} onChangeText={setCurrency} />

        <Text style={styles.label}>Liability Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={liabilityType}
            onValueChange={(val) => setLiabilityType(val)}
            style={styles.picker}
          >
            <Picker.Item label="Debt" value="debt" />
            <Picker.Item label="Loan" value="loan" />
            <Picker.Item label="Mortgage" value="mortgage" />
          </Picker>
        </View>

        <Text style={styles.label}>Liability Direction *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={liabilityDirection}
            onValueChange={(val) => setLiabilityDirection(val)}
            style={styles.picker}
          >
            <Picker.Item label="I owe" value="debit" />
            <Picker.Item label="I am owed" value="credit" />
          </Picker>
        </View>

        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Start Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
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
        <TextInput
          style={styles.input}
          value={interest}
          onChangeText={setInterest}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Interest Period</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={interestPeriod}
            onValueChange={(val) => setInterestPeriod(val)}
            style={styles.picker}
          >
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Yearly" value="yearly" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create Liability</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetForm}>
          <Text style={styles.buttonText}>Reset Form</Text>
        </TouchableOpacity>
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
  dateButton: { padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8, marginBottom: 15 },
  dateText: { fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 20 },
  picker: { height: 50, width: "100%" },
  button: { backgroundColor: "#2196F3", padding: 15, borderRadius: 8, marginBottom: 10 },
  resetButton: { backgroundColor: "#FF5722" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
