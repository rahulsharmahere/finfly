// src/hooks/useAppUpdater.js
import { useEffect } from "react";
import { Alert, Linking } from "react-native";
import DeviceInfo from "react-native-device-info";

export default function useAppUpdater({ owner, repo }) {
  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const currentVersion = DeviceInfo.getVersion(); // e.g. "1.0.0"

        // Fetch latest release from GitHub
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases/latest`
        );
        const data = await response.json();

        const latestVersion = data.tag_name?.replace("v", ""); // remove 'v'
        const apkUrl = data.assets?.[0]?.browser_download_url;

        if (!latestVersion || !apkUrl) return;

        // Compare versions
        if (latestVersion !== currentVersion) {
          Alert.alert(
            "Update Available",
            `A new version (${latestVersion}) is available. You are on ${currentVersion}.`,
            [
              { text: "Later" },
              { text: "Update", onPress: () => Linking.openURL(apkUrl) }
            ]
          );
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    // Run check once when app starts
    checkForUpdate();
  }, [owner, repo]);
}
