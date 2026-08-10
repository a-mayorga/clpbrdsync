import { globalShortcut } from "electron";

import type { GlobalShortcutRegistrar } from "../core/global-shortcut-registrar";

export class ElectronGlobalShortcutRegistrar implements GlobalShortcutRegistrar {
  register(accelerator: string, callback: () => void): boolean {
    return globalShortcut.register(accelerator, callback);
  }

  unregister(accelerator: string): void {
    globalShortcut.unregister(accelerator);
  }
}
