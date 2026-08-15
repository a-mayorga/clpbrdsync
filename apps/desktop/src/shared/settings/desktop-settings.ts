export type DesktopSettings = {
  historyLimit: number;
  clipboardPollingIntervalMs: number;
  quickPasteShortcut: string;
};

export type DesktopSettingsUpdate = Partial<DesktopSettings>;

export const DEFAULT_DESKTOP_SETTINGS: DesktopSettings = {
  historyLimit: 100,
  clipboardPollingIntervalMs: 500,
  quickPasteShortcut: "CommandOrControl+Shift+V",
};
