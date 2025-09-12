// src/hooks/useAppUpdater.js
import { useState, useEffect, useCallback } from "react";
import { Alert, Linking, Platform, ToastAndroid } from "react-native";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { downloadApkStart } from "../utils/downloadAndInstallApk";
import FileViewer from "react-native-file-viewer";

const LAST_CHECK_KEY = "app_updater_last_check";
const SKIPPED_VERSION_KEY = "app_updater_skipped_version";

/** compare semantic versions (returns >0 if v1 > v2) */
function compareVersions(v1, v2) {
  const a = String(v1).split(".").map((n) => parseInt(n || "0", 10));
  const b = String(v2).split(".").map((n) => parseInt(n || "0", 10));
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Normalize simple '1.1' -> '1.1.0' */
function normalizeVersion(v) {
  if (!v) return v;
  const parts = v.split(".");
  if (parts.length === 2) return `${v}.0`;
  return v;
}

/**
 * useAppUpdater
 * - owner, repo: GitHub repo owner/name (for releases)
 * - autoCheck: if true, runs check once on mount (and only once a day)
 *
 * Returns:
 * { checking, updateAvailable, checkForUpdate, handleUpdateNow, handleLater,
 *   downloading, downloadProgress, cancelDownload, currentVersion }
 */
export default function useAppUpdater({ owner, repo, autoCheck = true } = {}) {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(null); // { latestVersion, downloadUrl }
  const [skippedVersion, setSkippedVersion] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadCancelFn, setDownloadCancelFn] = useState(null);

  const currentVersion = DeviceInfo.getVersion();

  // load skipped version once
  useEffect(() => {
    (async () => {
      try {
        const sv = await AsyncStorage.getItem(SKIPPED_VERSION_KEY);
        if (sv) setSkippedVersion(sv);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Helper: was last check today?
  const wasCheckedToday = async () => {
    try {
      const raw = await AsyncStorage.getItem(LAST_CHECK_KEY);
      if (!raw) return false;
      const lastDate = raw.split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      return lastDate === today;
    } catch {
      return false;
    }
  };

  /**
   * checkForUpdate options:
   * - force: ignore last-checked daily throttle
   * - showNoUpdateAlert: when no update found (manual checks) show "you are latest"
   */
  const checkForUpdate = useCallback(
    async ({ force = false, showNoUpdateAlert = false } = {}) => {
      setChecking(true);
      try {
        if (!force) {
          const already = await wasCheckedToday();
          if (already) {
            setChecking(false);
            return { checked: false, reason: "already_checked_today" };
          }
        }

        // Fetch latest release from GitHub
        const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Release fetch failed with status " + res.status);
        const data = await res.json();

        const tagNameRaw = data.tag_name || data.name || "";
        const latestVersionRaw = tagNameRaw.replace(/^v/i, "");
        const latestVersion = normalizeVersion(latestVersionRaw);
        const apkAsset = (data.assets || []).find((a) => a && a.name && a.name.endsWith(".apk"));
        // fallback to release page if no asset
        const downloadUrl = apkAsset?.browser_download_url || data.html_url || null;

        if (!latestVersion) {
          if (showNoUpdateAlert) Alert.alert("Update", "Could not determine latest version.");
          await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
          return { checked: true, found: false };
        }

        // Compare
        const normalizedCurrent = normalizeVersion(currentVersion);
        if (compareVersions(latestVersion, normalizedCurrent) > 0 && latestVersion !== skippedVersion) {
          setUpdateAvailable({ latestVersion, downloadUrl });
          // do NOT set last-check here — we want to allow retrying later, but still mark checked
          await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
          return { checked: true, found: true };
        } else {
          if (showNoUpdateAlert) {
            Alert.alert("Up to date", `You are on the latest version (${currentVersion}).`);
          }
          await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
          return { checked: true, found: false };
        }
      } catch (err) {
        console.error("checkForUpdate error:", err);
        if (showNoUpdateAlert) {
          Alert.alert("Update check failed", "Could not check for updates. Please try again later.");
        }
        return { checked: false, error: err };
      } finally {
        setChecking(false);
      }
    },
    [owner, repo, currentVersion, skippedVersion]
  );

  const handleLater = useCallback(async () => {
    if (updateAvailable?.latestVersion) {
      try {
        await AsyncStorage.setItem(SKIPPED_VERSION_KEY, updateAvailable.latestVersion);
        setSkippedVersion(updateAvailable.latestVersion);
      } catch (e) {
        // ignore
      }
    }
    setUpdateAvailable(null);
  }, [updateAvailable]);

  const handleUpdateNow = useCallback(async () => {
    if (!updateAvailable?.downloadUrl) {
      Alert.alert("Update", "No download URL available for the update.");
      return;
    }

    // iOS — open store link (can't install IPA)
    if (Platform.OS !== "android") {
      Linking.openURL(updateAvailable.downloadUrl);
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const filename = `FinFly-${updateAvailable.latestVersion}.apk`;

      // downloadApkStart returns { promise, cancel }
      const { promise, cancel } = await downloadApkStart(
        updateAvailable.downloadUrl,
        filename,
        (percent) => {
          setDownloadProgress(percent);
        }
      );

      // Save cancel function so user can abort
      setDownloadCancelFn(() => cancel);

      let filePath;
      try {
        filePath = await promise; // resolves with destPath
      } catch (err) {
        // download failed or was cancelled
        throw err;
      }

      // Open installer
      try {
        await FileViewer.open(filePath, { showOpenWithDialog: true });
      } catch (e) {
        // If opening installer fails, let the user know
        throw e;
      }
    } catch (err) {
      console.error("Update download/install failed:", err);
      if (Platform.OS === "android") {
        ToastAndroid.show("Update failed, will try later", ToastAndroid.LONG);
      } else {
        Alert.alert("Update failed", "Could not download or install update.");
      }
      // leave updateAvailable intact so user may try again (or you can clear it)
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
      setDownloadCancelFn(null);
    }
  }, [updateAvailable]);

  const cancelDownload = useCallback(() => {
    try {
      if (downloadCancelFn) {
        downloadCancelFn();
      }
    } catch (e) {
      console.error("cancelDownload err:", e);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
      setDownloadCancelFn(null);
      if (Platform.OS === "android") {
        ToastAndroid.show("Update cancelled", ToastAndroid.SHORT);
      } else {
        // no-op on iOS
      }
    }
  }, [downloadCancelFn]);

  // Auto-check once on mount (but will obey daily throttle)
  useEffect(() => {
    if (autoCheck && owner && repo) {
      // fire-and-forget
      checkForUpdate({ force: false, showNoUpdateAlert: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheck, owner, repo]);

  return {
    checking,
    updateAvailable, // { latestVersion, downloadUrl } or null
    checkForUpdate, // call: checkForUpdate({ force: true, showNoUpdateAlert: true })
    handleLater,
    handleUpdateNow,
    downloading,
    downloadProgress,
    cancelDownload,
    currentVersion,
  };
}
