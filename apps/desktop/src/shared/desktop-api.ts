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

    onChanged(handler: (items: readonly ClipboardHistoryItem[]) => void): () => void;
  };
}
