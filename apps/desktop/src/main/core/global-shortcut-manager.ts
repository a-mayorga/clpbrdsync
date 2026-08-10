import type { GlobalShortcutRegistrar } from "./global-shortcut-registrar";

type GlobalShortcutManagerOptions = {
  registrar: GlobalShortcutRegistrar;
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

    const registered = this.options.registrar.register(QUICK_PASTE_SHORTCUT, () => {
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

    this.options.registrar.unregister(QUICK_PASTE_SHORTCUT);
    this.isRegistered = false;
  }
}
