// src/components/UpdateModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ProgressBarAndroid,
  ProgressViewIOS,
} from "react-native";

export default function UpdateModal({
  visible,
  updateAvailable,
  currentVersion,
  onUpdateNow,
  onLater,
  downloading = false,
  progress = 0,
  onCancelDownload,
}) {
  if (!visible) return null;

  const latest = updateAvailable?.latestVersion ?? null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.box}>
          {!downloading ? (
            <>
              <Text style={styles.title}>Update Available</Text>
              <Text style={styles.label}>
                New version: <Text style={styles.bold}>{latest}</Text>
              </Text>
              <Text style={styles.label}>
                Current version: <Text style={styles.bold}>{currentVersion}</Text>
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onLater}>
                  <Text style={styles.btnText}>Later</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.updateBtn]} onPress={onUpdateNow}>
                  <Text style={styles.btnText}>Update Now</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Downloading Update</Text>
              <Text style={{ marginBottom: 12 }}>{progress}%</Text>

              {Platform.OS === "android" ? (
                <ProgressBarAndroid styleAttr="Horizontal" indeterminate={false} progress={progress / 100} />
              ) : (
                <ProgressViewIOS progress={progress / 100} />
              )}

              <View style={{ height: 18 }} />

              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancelDownload}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "86%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 15, marginBottom: 6 },
  bold: { fontWeight: "700" },
  actionsRow: { flexDirection: "row", marginTop: 14, width: "100%", justifyContent: "space-between" },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 6 },
  cancelBtn: { backgroundColor: "#999" },
  updateBtn: { backgroundColor: "#007AFF" },
  btnText: { color: "#fff", fontWeight: "700" },
});
