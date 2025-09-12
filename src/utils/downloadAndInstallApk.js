// src/utils/downloadAndInstallApk.js
import RNFS from "react-native-fs";
import { PermissionsAndroid, Platform } from "react-native";

/**
 * Start downloading APK and report progress. Returns { promise, cancel }.
 *
 * - promise resolves with the downloaded file path
 * - cancel() aborts the download (RNFS.stopDownload)
 */
export async function downloadApkStart(url, filename, onProgress = () => {}) {
  if (Platform.OS !== "android") {
    throw new Error("downloadApkStart: only supported on Android");
  }

  // Request write permission
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: "Storage permission required",
      message: "App needs storage permission to download the update APK",
      buttonPositive: "OK",
    }
  );

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error("Permission denied");
  }

  const destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;

  let jobId = null;
  const dl = RNFS.downloadFile({
    fromUrl: url,
    toFile: destPath,
    begin: (res) => {
      jobId = res.jobId;
    },
    progress: (res) => {
      const bytesWritten = res.bytesWritten ?? res.contentLengthWritten ?? 0;
      const contentLength = res.contentLength ?? res.contentLengthProvided ?? 0;
      const percent = contentLength ? Math.floor((bytesWritten / contentLength) * 100) : 0;
      onProgress(Math.min(100, Math.max(0, percent)));
    },
    progressDivider: 1,
  });

  const promise = dl.promise.then((res) => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      return destPath;
    }
    throw new Error("Download failed with status " + res.statusCode);
  });

  const cancel = () => {
    if (jobId) {
      try {
        RNFS.stopDownload(jobId);
      } catch (e) {
        // ignore
      }
    }
  };

  return { promise, cancel };
}
