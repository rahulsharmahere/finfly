import React from "react";
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useUpdate } from "../context/UpdateContext";
import { Bar as ProgressBar } from "react-native-progress";

export default function UpdateModal() {
  const {
    visible,
    isChecking,
    latestVersion,
    onUpdateNow,
    onLater,
    progress,
  } = useUpdate();

  if (!visible) return null;

  const isDownloading = progress > 0 && progress < 100;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Available 🎉</Text>

          {isChecking ? (
            <>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.text}>Checking for updates...</Text>
            </>
          ) : (
            <>
              <Text style={styles.text}>
                A new version ({latestVersion}) is available.
              </Text>

              {isDownloading ? (
                <>
                  <Text style={[styles.text, { marginVertical: 8 }]}>
                    Downloading: {Math.round(progress)}%
                  </Text>
                  <ProgressBar
                    progress={progress / 100}
                    width={200}
                    color="#007AFF"
                  />
                </>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.updateBtn]}
                    onPress={onUpdateNow}
                  >
                    <Text style={styles.buttonText}>Update Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.laterBtn]}
                    onPress={onLater}
                  >
                    <Text style={styles.buttonText}>Later</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 4,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  updateBtn: {
    backgroundColor: "#007AFF",
  },
  laterBtn: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
