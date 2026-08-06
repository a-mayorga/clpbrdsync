import { app, ipcMain } from "electron";

import type { DesktopPlatform, DesktopRuntimeInfo } from "../../../shared/desktop-api";
import { IPC_CHANNELS } from "../../../shared/ipc-channels";

const processStartedAt = new Date().toISOString();

function getDesktopPlatform(): DesktopPlatform {
  switch (process.platform) {
    case "darwin":
    case "win32":
    case "linux":
      return process.platform;
    default:
      throw new Error(`Unsupported desktop platform: ${process.platform}`);
  }
}

export function registerRuntimeIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.runtime.getInfo,
    (): DesktopRuntimeInfo => ({
      platform: getDesktopPlatform(),
      appVersion: app.getVersion(),
      processStartedAt,
    }),
  );
}

export function unregisterRuntimeIpc(): void {
  ipcMain.removeHandler(IPC_CHANNELS.runtime.getInfo);
}
