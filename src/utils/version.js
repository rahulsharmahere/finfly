// src/utils/version.js
import DeviceInfo from "react-native-device-info";

export const appVersion = DeviceInfo.getVersion(); // versionName (Android), CFBundleShortVersionString (iOS)
export const buildNumber = DeviceInfo.getBuildNumber(); // versionCode (Android), CFBundleVersion (iOS)

export default `${appVersion} (build ${buildNumber})`;
