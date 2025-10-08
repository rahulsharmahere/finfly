import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useAppUpdater from "../hooks/useAppUpdater";
import { version as appVersion } from "../../package.json";

const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
  const {
    isChecking,
    updateAvailable,
    latestVersion,
    checkForUpdate,
    onUpdateNow,
    progress,
  } = useAppUpdater(appVersion);

  const [hasShownAutoPopup, setHasShownAutoPopup] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Auto check when app starts
  useEffect(() => {
    checkForUpdate(); // silent
  }, []);

  // Auto popup when update found
  useEffect(() => {
    if (updateAvailable && !hasShownAutoPopup) {
      setHasShownAutoPopup(true);
      setShowUpdateModal(true);
    }
  }, [updateAvailable]);

  // Manual check from menu
  const manualCheck = async () => {
    console.log("🔍 Manual check triggered...");
    await checkForUpdate({ force: true });
    if (updateAvailable) {
      setShowUpdateModal(true);
    } else {
      // No update available
      setShowUpdateModal(false);
      alert("✅ No update available — you’re on the latest version!");
    }
  };

  const handleUpdateNow = () => {
    setShowUpdateModal(false);
    setIsDownloading(true);
    onUpdateNow().finally(() => setIsDownloading(false));
  };

  const handleLater = () => {
    setShowUpdateModal(false);
  };

  return (
    <UpdateContext.Provider
      value={{
        isChecking,
        updateAvailable,
        latestVersion,
        progress,
        checkForUpdate: manualCheck,
        manualCheck,
        onUpdateNow,
      }}
    >
      {children}

      {/* 🪄 Update Available Modal */}
      <Modal visible={showUpdateModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Update Available 🚀</Text>
            <Text style={styles.message}>
              A new version (v{latestVersion}) of FinFly is available.
              Would you like to download it now?
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.downloadButton]}
                onPress={handleUpdateNow}
              >
                <Icon name="file-download" size={20} color="#fff" />
                <Text style={styles.buttonText}>Download Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.laterButton]}
                onPress={handleLater}
              >
                <Icon name="access-time" size={20} color="#333" />
                <Text style={[styles.buttonText, { color: "#333" }]}>Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ⏬ Download Progress Modal */}
      <Modal visible={isDownloading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.title}>Downloading Update...</Text>
            <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 10 }} />
            <Text style={styles.progressText}>{Math.floor(progress)}%</Text>
          </View>
        </View>
      </Modal>
    </UpdateContext.Provider>
  );
};

export const useUpdate = () => useContext(UpdateContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: 250,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#222",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  downloadButton: {
    backgroundColor: "#7969d3ff",
  },
  laterButton: {
    backgroundColor: "#c56c6cff",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressText: {
    marginTop: 5,
    fontSize: 16,
  },
});

export default UpdateContext;
