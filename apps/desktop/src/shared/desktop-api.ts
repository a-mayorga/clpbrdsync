import type { ClipboardHistoryItem } from "./clipboard/clipboard-history-item";

export type DesktopPlatform = "darwin" | "win32" | "linux";

export type DesktopRuntimeInfo = {
  platform: DesktopPlatform;
  appVersion: string;
  processStartedAt: string;
};

export interface DesktopApi {
  getRuntimeInfo(): Promise<DesktopRuntimeInfo>;

  clipboardHistory: {
    getItems(): Promise<readonly ClipboardHistoryItem[]>;

    copyItem(itemId: string): Promise<void>;

    clear(): Promise<void>;

    onChanged(handler: (items: readonly ClipboardHistoryItem[]) => void): () => void;
  };

  quickPaste: {
    hide(): Promise<void>;
  };
}
