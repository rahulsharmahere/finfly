// src/context/UpdateContext.js
import React, { createContext, useContext } from "react";
import useAppUpdater from "../hooks/useAppUpdater";
import UpdateModal from "../components/UpdateModal";

const UpdateContext = createContext(null);

export function UpdateProvider({ owner, repo, children, autoCheck = true }) {
  const updater = useAppUpdater({ owner, repo, autoCheck });

  return (
    <UpdateContext.Provider value={updater}>
      {children}
      {/* Global modal always mounted so manual checks and auto-checks use same UI */}
      <UpdateModal
        visible={!!updater.updateAvailable || updater.downloading}
        updateAvailable={updater.updateAvailable}
        currentVersion={updater.currentVersion}
        onUpdateNow={updater.handleUpdateNow}
        onLater={updater.handleLater}
        downloading={updater.downloading}
        progress={updater.downloadProgress}
        onCancelDownload={updater.cancelDownload}
      />
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  return useContext(UpdateContext);
}
