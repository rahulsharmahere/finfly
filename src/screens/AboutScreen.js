// src/screens/AboutMe.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ThreeDotMenu from "../components/ThreeDotMenu";
import Footer from "../components/Footer";

import appVersion from "../utils/version";

export default function AboutMe() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <ThreeDotMenu />
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>About This App</Text>
        <Text style={styles.paragraph}>
          This app is designed to help you manage your finances efficiently,
          track transactions, categorize expenses, and get insights into your
          spending habits. It integrates with Firefly III to bring your
          financial data directly to your mobile device.
        </Text>

        {/* ✅ App Version */}
        <Text style={styles.paragraph}>Version: {appVersion}</Text>

        <Text style={styles.title}>About Me</Text>
        <Text style={styles.paragraph}>
          Hi! I'm Rahul Sharma, the developer behind this app. You can check out
          my work and projects on my website:{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://rahulsharmahere.com/")}
          >
            rahulsharmahere.com
          </Text>
          . I enjoy building tools that make people's lives easier and more
          productive.
        </Text>

        <Text style={styles.title}>License</Text>
        <Text style={styles.paragraph}>
          This app is released under the MIT License, which means you are free
          to use, modify, and distribute it, provided that the original
          copyright notice and license are included in any copies or substantial
          portions of the software.
        </Text>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  // Header
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

  content: {
    padding: 16,
    paddingBottom: 80, // leave space for footer
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: "#333",
  },
  link: {
    color: "#2196F3",
    textDecorationLine: "underline",
  },
});
