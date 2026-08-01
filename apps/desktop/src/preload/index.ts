import { contextBridge, ipcRenderer } from "electron";

import type { DesktopApi } from "../shared/desktop-api";
import { IPC_CHANNELS } from "../shared/ipc-channels";

const desktopApi: DesktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke(IPC_CHANNELS.runtime.getInfo),
};

if (!process.contextIsolated) {
  throw new Error("ClpbrdSync requires context isolation.");
}

contextBridge.exposeInMainWorld("clpbrdSync", desktopApi);
