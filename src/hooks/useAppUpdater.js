import { useState } from "react";
import semver from "semver";
import downloadAndInstallApk, { cancelDownload } from "../utils/downloadAndInstallApk";

const GITHUB_REPO = "rahulsharmahere/finfly";

export default function useAppUpdater(currentVersion = "1.0.0") {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [apkUrl, setApkUrl] = useState(null);
  const [progress, setProgress] = useState(0);

  const checkForUpdate = async ({ force = false } = {}) => {
    try {
      setIsChecking(true);
      console.log("🚀 Checking for update...");
      console.log("📦 Current version:", currentVersion);

      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      const release = await res.json();

      if (!release || !release.tag_name) throw new Error("No release found");

      const latestName = release.tag_name.replace(/^v/, "");
      console.log("📥 Found latest release:", release.tag_name);

      const apkAsset = release.assets?.find(a => a.name.endsWith(".apk"));
      if (!apkAsset) console.warn("⚠️ No APK asset found in release");

      if (semver.gt(latestName, currentVersion) || force) {
        setUpdateAvailable(true);
        setLatestVersion(latestName);
        if (apkAsset) setApkUrl(apkAsset.browser_download_url);
        console.log("✅ APK URL set:", apkAsset?.browser_download_url);
      } else {
        setUpdateAvailable(false);
        console.log("👍 App is up to date.");
      }
    } catch (err) {
      console.error("❌ Update check failed:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const onUpdateNow = async () => {
    try {
      setProgress(0);
      const path = await downloadAndInstallApk(apkUrl, latestVersion, setProgress);
      if (path === null) return; // cancelled
      console.log("✅ APK saved at:", path);
    } catch (err) {
      if (err.message === "cancelled") console.log("⏹️ Update cancelled");
      else console.error("❌ Update failed:", err.message);
    }
  };

  const onCancelDownload = () => {
    console.log("⏹️ Cancel download requested");
    try { cancelDownload(); } catch (e) { console.error("❌ Cancel failed:", e); }
    setProgress(0);
  };

  return {
    isChecking,
    updateAvailable,
    latestVersion,
    checkForUpdate,
    onUpdateNow,
    onCancelDownload,
    progress,
    apkUrl,
  };
}
