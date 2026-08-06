import { type BrowserWindow, ipcMain } from "electron";

import type { ClipboardHistoryItem } from "../../../../shared/clipboard/clipboard-history-item";
import { IPC_CHANNELS } from "../../../../shared/ipc-channels";
import type { ClipboardHistoryService } from "../application/clipboard-history-service";

type ClipboardHistoryIpcDependencies = {
  historyService: ClipboardHistoryService;
  getMainWindow(): BrowserWindow | null;
};

export class ClipboardHistoryIpc {
  private unsubscribeHistory: (() => void) | null = null;

  constructor(private readonly dependencies: ClipboardHistoryIpcDependencies) {}

  register(): void {
    ipcMain.handle(IPC_CHANNELS.clipboardHistory.getItems, () => {
      return this.dependencies.historyService.getItems();
    });

    this.unsubscribeHistory = this.dependencies.historyService.subscribe((items) => {
      this.sendHistoryChanged(items);
    });
  }

  unregister(): void {
    ipcMain.removeHandler(IPC_CHANNELS.clipboardHistory.getItems);
    this.unsubscribeHistory?.();
    this.unsubscribeHistory = null;
  }

  private sendHistoryChanged(items: readonly ClipboardHistoryItem[]): void {
    const window = this.dependencies.getMainWindow();

    if (!window || window.isDestroyed()) {
      return;
    }

    window.webContents.send(IPC_CHANNELS.clipboardHistory.changed, items);
  }
}
