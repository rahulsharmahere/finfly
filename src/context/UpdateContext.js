import React, { createContext, useContext, useEffect, useState } from "react";
import useAppUpdater from "../hooks/useAppUpdater";
import { version as appVersion } from "../../package.json";
import { cancelDownload } from "../utils/downloadAndInstallApk";

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

  const [visible, setVisible] = useState(false);

  // Show modal only when update becomes available
  useEffect(() => {
    if (updateAvailable) {
      console.log("📢 Update available, showing modal");
      setVisible(true);
    }
  }, [updateAvailable]);

  const onLater = () => {
    console.log("⏸️ User clicked Later");
    setVisible(false);
  };

  const onCancel = () => {
    console.log("⏹️ User clicked Cancel");
    cancelDownload();
    setVisible(false);
  };

  return (
    <UpdateContext.Provider
      value={{
        isChecking,
        updateAvailable,
        latestVersion,
        visible,
        onUpdateNow,
        progress,
        checkForUpdate,
        onLater,
        onCancel,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = () => useContext(UpdateContext);
