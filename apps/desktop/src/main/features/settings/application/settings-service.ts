import {
  DEFAULT_DESKTOP_SETTINGS,
  type DesktopSettings,
  type DesktopSettingsUpdate,
} from "../../../../shared/settings/desktop-settings";
import type { SettingsRepository } from "./settings-repository";

type SettingsChangedHandler = (settings: DesktopSettings) => void;

type SettingsServiceOptions = {
  repository: SettingsRepository;
};

export class SettingsService {
  private settings: DesktopSettings = {
    ...DEFAULT_DESKTOP_SETTINGS,
  };
  private readonly changeHandlers = new Set<SettingsChangedHandler>();

  constructor(private readonly options: SettingsServiceOptions) {}

  initialize(): void {
    this.options.repository.initialize();

    this.settings = {
      historyLimit: this.readInteger("historyLimit", DEFAULT_DESKTOP_SETTINGS.historyLimit),

      clipboardPollingIntervalMs: this.readInteger(
        "clipboardPollingIntervalMs",
        DEFAULT_DESKTOP_SETTINGS.clipboardPollingIntervalMs,
      ),

      quickPasteShortcut:
        this.options.repository.find("quickPasteShortcut") ??
        DEFAULT_DESKTOP_SETTINGS.quickPasteShortcut,
    };

    this.validateSettings(this.settings);
  }

  getSettings(): DesktopSettings {
    return {
      ...this.settings,
    };
  }

  update(update: DesktopSettingsUpdate): DesktopSettings {
    const candidate: DesktopSettings = {
      ...this.settings,
      ...update,
    };

    this.validateSettings(candidate);

    if (update.historyLimit !== undefined) {
      this.options.repository.set("historyLimit", String(update.historyLimit));
    }

    if (update.clipboardPollingIntervalMs !== undefined) {
      this.options.repository.set(
        "clipboardPollingIntervalMs",
        String(update.clipboardPollingIntervalMs),
      );
    }

    if (update.quickPasteShortcut !== undefined) {
      this.options.repository.set("quickPasteShortcut", update.quickPasteShortcut);
    }

    this.settings = candidate;

    this.notifyChange();

    return this.getSettings();
  }

  subscribe(handler: SettingsChangedHandler): () => void {
    this.changeHandlers.add(handler);

    return () => {
      this.changeHandlers.delete(handler);
    };
  }

  dispose(): void {
    this.changeHandlers.clear();
    this.options.repository.close();
  }

  private readInteger(key: string, fallback: number): number {
    const persisted = this.options.repository.find(key);

    if (persisted === null) {
      return fallback;
    }

    const value = Number(persisted);

    return Number.isInteger(value) ? value : fallback;
  }

  private validateSettings(settings: DesktopSettings): void {
    if (
      !Number.isInteger(settings.historyLimit) ||
      settings.historyLimit < 10 ||
      settings.historyLimit > 1000
    ) {
      throw new Error("History limit must be an integer between 10 and 1000.");
    }

    if (
      !Number.isInteger(settings.clipboardPollingIntervalMs) ||
      settings.clipboardPollingIntervalMs < 100 ||
      settings.clipboardPollingIntervalMs > 5000
    ) {
      throw new Error("Clipboard polling interval must be between 100 and 5000 milliseconds.");
    }

    if (settings.quickPasteShortcut.trim().length === 0) {
      throw new Error("Quick Paste shortcut cannot be empty.");
    }
  }

  private notifyChange(): void {
    const snapshot = this.getSettings();

    for (const handler of this.changeHandlers) {
      handler(snapshot);
    }
  }
}
