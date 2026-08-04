import { app, ipcMain } from "electron";

import type { DesktopRuntimeInfo } from "../../../shared/desktop-api";
import { IPC_CHANNELS } from "../../../shared/ipc-channels";

const processStartedAt = new Date().toISOString();

export function registerRuntimeIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.runtime.getInfo,
    (): DesktopRuntimeInfo => ({
      platform: process.platform,
      appVersion: app.getVersion(),
      processStartedAt,
    }),
  );
}

export function unregisterRuntimeIpc(): void {
  ipcMain.removeHandler(IPC_CHANNELS.runtime.getInfo);
}
