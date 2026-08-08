import { contextBridge, ipcRenderer } from "electron";

import type { ClipboardHistoryItem } from "../shared/clipboard/clipboard-history-item";
import type { DesktopApi } from "../shared/desktop-api";
import { IPC_CHANNELS } from "../shared/ipc-channels";

const desktopApi: DesktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke(IPC_CHANNELS.runtime.getInfo),

  clipboardHistory: {
    getItems: () => ipcRenderer.invoke(IPC_CHANNELS.clipboardHistory.getItems),

    copyItem: (itemId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.clipboardHistory.copyItem, itemId),

    clear: () => ipcRenderer.invoke(IPC_CHANNELS.clipboardHistory.clear),

    onChanged: (handler: (items: readonly ClipboardHistoryItem[]) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        items: readonly ClipboardHistoryItem[],
      ): void => {
        handler(items);
      };

      ipcRenderer.on(IPC_CHANNELS.clipboardHistory.changed, listener);

      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.clipboardHistory.changed, listener);
      };
    },
  },
};

if (!process.contextIsolated) {
  throw new Error("ClpbrdSync requires context isolation.");
}

contextBridge.exposeInMainWorld("clpbrdSync", desktopApi);
