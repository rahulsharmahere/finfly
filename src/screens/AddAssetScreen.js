// src/screens/AddAssetScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { createAccount } from "../utils/fireflyApi";
import { useNavigation } from "@react-navigation/native";

export default function AddAssetScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter account name");
      return;
    }

    try {
      await createAccount({
        name,
        type: "asset",
        openingBalance: parseFloat(openingBalance) || 0,
      });
      Alert.alert("Success", "Asset account created successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Error creating account:", err);
      Alert.alert("Error", "Failed to create account");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Account Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter account name"
      />

      <Text style={styles.label}>Opening Balance</Text>
      <TextInput
        style={styles.input}
        value={openingBalance}
        onChangeText={setOpeningBalance}
        placeholder="Enter opening balance"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    marginTop: 24,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
