import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../../../shared/ipc-channels";
import type { DesktopSettings } from "../../../../shared/settings/desktop-settings";
import type { SettingsService } from "../application/settings-service";
import { parseSettingsUpdate } from "./parse-settings-update";

type SettingsIpcDependencies = {
  settingsService: SettingsService;
  broadcast(channel: string, ...args: unknown[]): void;
};

export class SettingsIpc {
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private readonly dependencies: SettingsIpcDependencies) {}

  register(): void {
    ipcMain.handle(IPC_CHANNELS.settings.get, (): DesktopSettings => {
      return this.dependencies.settingsService.getSettings();
    });

    ipcMain.handle(IPC_CHANNELS.settings.update, (_event, rawUpdate: unknown) => {
      const update = parseSettingsUpdate(rawUpdate);

      return this.dependencies.settingsService.update(update);
    });

    this.unsubscribeSettings = this.dependencies.settingsService.subscribe((settings) => {
      this.dependencies.broadcast(IPC_CHANNELS.settings.changed, settings);
    });
  }

  unregister(): void {
    ipcMain.removeHandler(IPC_CHANNELS.settings.get);
    ipcMain.removeHandler(IPC_CHANNELS.settings.update);
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
  }
}
