import React from "react";
import { View, Text } from "react-native";

export default function AboutScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>FinFly v1.0</Text>
      <Text>Personal Finance App powered by Firefly III</Text>
    </View>
  );
}
