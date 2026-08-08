import { globalShortcut } from "electron";

type GlobalShortcutManagerOptions = {
  onQuickPasteRequested(): void;
};

const QUICK_PASTE_SHORTCUT = "CommandOrControl+Shift+V";

export class GlobalShortcutManager {
  private isRegistered = false;

  constructor(private readonly options: GlobalShortcutManagerOptions) {}

  register(): void {
    if (this.isRegistered) {
      return;
    }

    const registered = globalShortcut.register(QUICK_PASTE_SHORTCUT, () => {
      this.options.onQuickPasteRequested();
    });

    if (!registered) {
      console.error(`Could not register global shortcut: ${QUICK_PASTE_SHORTCUT}`);

      return;
    }

    this.isRegistered = true;
  }

  unregister(): void {
    if (!this.isRegistered) {
      return;
    }

    globalShortcut.unregister(QUICK_PASTE_SHORTCUT);
    this.isRegistered = false;
  }
}
