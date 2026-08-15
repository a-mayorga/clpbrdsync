import type { GlobalShortcutRegistrar } from "./global-shortcut-registrar";

type GlobalShortcutManagerOptions = {
  registrar: GlobalShortcutRegistrar;
  quickPasteShortcut: string;
  onQuickPasteRequested(): void;
};

export class GlobalShortcutManager {
  private isRegistered = false;

  constructor(private readonly options: GlobalShortcutManagerOptions) {}

  register(): void {
    if (this.isRegistered) {
      return;
    }

    const registered = this.options.registrar.register(this.options.quickPasteShortcut, () => {
      this.options.onQuickPasteRequested();
    });

    if (!registered) {
      console.error(`Could not register global shortcut: ${this.options.quickPasteShortcut}`);

      return;
    }

    this.isRegistered = true;
  }

  unregister(): void {
    if (!this.isRegistered) {
      return;
    }

    this.options.registrar.unregister(this.options.quickPasteShortcut);
    this.isRegistered = false;
  }
}
