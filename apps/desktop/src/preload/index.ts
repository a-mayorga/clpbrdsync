import { contextBridge, ipcRenderer } from "electron";

import type { ClipboardHistorySnapshot } from "../shared/clipboard/clipboard-history-snapshot";
import type { DesktopApi } from "../shared/desktop-api";
import { IPC_CHANNELS } from "../shared/ipc-channels";
import type { DesktopSettings, DesktopSettingsUpdate } from "../shared/settings/desktop-settings";

const desktopApi: DesktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke(IPC_CHANNELS.runtime.getInfo),

  clipboardHistory: {
    getSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.clipboardHistory.getSnapshot),

    copyItem: (itemId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.clipboardHistory.copyItem, itemId),

    clear: () => ipcRenderer.invoke(IPC_CHANNELS.clipboardHistory.clear),

    onChanged: (handler: (snapshot: ClipboardHistorySnapshot) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        snapshot: ClipboardHistorySnapshot,
      ): void => {
        handler(snapshot);
      };

      ipcRenderer.on(IPC_CHANNELS.clipboardHistory.changed, listener);

      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.clipboardHistory.changed, listener);
      };
    },
  },

  quickPaste: {
    hide: () => ipcRenderer.invoke(IPC_CHANNELS.quickPaste.hide),
  },

  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settings.get),

    update: (update: DesktopSettingsUpdate) =>
      ipcRenderer.invoke(IPC_CHANNELS.settings.update, update),

    onChanged: (handler: (settings: DesktopSettings) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, settings: DesktopSettings): void => {
        handler(settings);
      };

      ipcRenderer.on(IPC_CHANNELS.settings.changed, listener);

      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.settings.changed, listener);
      };
    },
  },
};

if (!process.contextIsolated) {
  throw new Error("ClpbrdSync requires context isolation.");
}

contextBridge.exposeInMainWorld("clpbrdSync", desktopApi);
