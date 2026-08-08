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

    ipcMain.handle(IPC_CHANNELS.clipboardHistory.copyItem, (_event, itemId: unknown) => {
      if (typeof itemId !== "string" || itemId.length === 0) {
        throw new Error("A valid clipboard history item ID is required.");
      }

      this.dependencies.historyService.copyItem(itemId);
    });

    ipcMain.handle(IPC_CHANNELS.clipboardHistory.clear, () => {
      this.dependencies.historyService.clear();
    });
  }

  unregister(): void {
    ipcMain.removeHandler(IPC_CHANNELS.clipboardHistory.getItems);
    ipcMain.removeHandler(IPC_CHANNELS.clipboardHistory.copyItem);
    ipcMain.removeHandler(IPC_CHANNELS.clipboardHistory.clear);
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
