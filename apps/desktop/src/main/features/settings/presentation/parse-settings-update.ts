import type { DesktopSettingsUpdate } from "../../../../shared/settings/desktop-settings";

export function parseSettingsUpdate(value: unknown): DesktopSettingsUpdate {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Settings update must be an object.");
  }

  const record = value as Record<string, unknown>;

  const allowedKeys = new Set(["historyLimit", "clipboardPollingIntervalMs", "quickPasteShortcut"]);

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Unknown settings key: ${key}`);
    }
  }

  const update: DesktopSettingsUpdate = {};

  if ("historyLimit" in record) {
    if (typeof record.historyLimit !== "number") {
      throw new Error("historyLimit must be a number.");
    }

    update.historyLimit = record.historyLimit;
  }

  if ("clipboardPollingIntervalMs" in record) {
    if (typeof record.clipboardPollingIntervalMs !== "number") {
      throw new Error("clipboardPollingIntervalMs must be a number.");
    }

    update.clipboardPollingIntervalMs = record.clipboardPollingIntervalMs;
  }

  if ("quickPasteShortcut" in record) {
    if (typeof record.quickPasteShortcut !== "string") {
      throw new Error("quickPasteShortcut must be a string.");
    }

    update.quickPasteShortcut = record.quickPasteShortcut;
  }

  return update;
}
