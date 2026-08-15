import type { ClipboardHistorySnapshot } from "./clipboard/clipboard-history-snapshot";
import type { DesktopSettings, DesktopSettingsUpdate } from "./settings/desktop-settings";

export type DesktopPlatform = "darwin" | "win32" | "linux";

export type DesktopRuntimeInfo = {
  platform: DesktopPlatform;
  appVersion: string;
  processStartedAt: string;
};

export interface DesktopApi {
  getRuntimeInfo(): Promise<DesktopRuntimeInfo>;

  clipboardHistory: {
    getSnapshot(): Promise<ClipboardHistorySnapshot>;
    copyItem(itemId: string): Promise<void>;
    clear(): Promise<void>;
    onChanged(handler: (snapshot: ClipboardHistorySnapshot) => void): () => void;
  };

  quickPaste: {
    hide(): Promise<void>;
  };

  settings: {
    get(): Promise<DesktopSettings>;
    update(update: DesktopSettingsUpdate): Promise<DesktopSettings>;
    onChanged(handler: (settings: DesktopSettings) => void): () => void;
  };
}
