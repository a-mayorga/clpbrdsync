import { ipcMain } from "electron";

import { IPC_CHANNELS } from "../../../shared/ipc-channels";
import type { QuickPasteWindowManager } from "./quick-paste-window-manager";

type QuickPasteIpcDependencies = {
  windowManager: QuickPasteWindowManager;
};

export class QuickPasteIpc {
  constructor(private readonly dependencies: QuickPasteIpcDependencies) {}

  register(): void {
    ipcMain.handle(IPC_CHANNELS.quickPaste.hide, () => {
      this.dependencies.windowManager.hide();
    });
  }

  unregister(): void {
    ipcMain.removeHandler(IPC_CHANNELS.quickPaste.hide);
  }
}
