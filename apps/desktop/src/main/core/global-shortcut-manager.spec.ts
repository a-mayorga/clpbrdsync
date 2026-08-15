import { describe, expect, it, vi } from "vitest";
import { GlobalShortcutManager } from "./global-shortcut-manager";
import type { GlobalShortcutRegistrar } from "./global-shortcut-registrar";

const QUICK_PASTE_SHORTCUT = "CommandOrControl+Shift+V";

class FakeGlobalShortcutRegistrar implements GlobalShortcutRegistrar {
  registeredAccelerator: string | null = null;

  callback: (() => void) | null = null;

  shouldRegister = true;

  register(accelerator: string, callback: () => void): boolean {
    if (!this.shouldRegister) {
      return false;
    }

    this.registeredAccelerator = accelerator;
    this.callback = callback;

    return true;
  }

  unregister(accelerator: string): void {
    if (this.registeredAccelerator === accelerator) {
      this.registeredAccelerator = null;
      this.callback = null;
    }
  }
}

describe("GlobalShortcutManager", () => {
  it("registers the Quick Paste shortcut", () => {
    const registrar = new FakeGlobalShortcutRegistrar();

    const manager = new GlobalShortcutManager({
      registrar,
      quickPasteShortcut: QUICK_PASTE_SHORTCUT,
      onQuickPasteRequested: () => {},
    });

    manager.register();

    expect(registrar.registeredAccelerator).toBe(QUICK_PASTE_SHORTCUT);
  });

  it("invokes the Quick Paste callback", () => {
    const registrar = new FakeGlobalShortcutRegistrar();
    const onQuickPasteRequested = vi.fn();

    const manager = new GlobalShortcutManager({
      registrar,
      quickPasteShortcut: QUICK_PASTE_SHORTCUT,
      onQuickPasteRequested
    });

    manager.register();

    registrar.callback?.();

    expect(onQuickPasteRequested).toHaveBeenCalledTimes(1);
  });

  it("does not register twice", () => {
    const registrar = new FakeGlobalShortcutRegistrar();
    const registerSpy = vi.spyOn(registrar, "register");

    const manager = new GlobalShortcutManager({
      registrar,
      quickPasteShortcut: QUICK_PASTE_SHORTCUT,
      onQuickPasteRequested: () => {},
    });

    manager.register();
    manager.register();

    expect(registerSpy).toHaveBeenCalledTimes(1);
  });

  it("can retry if registration failed", () => {
    const registrar = new FakeGlobalShortcutRegistrar();

    registrar.shouldRegister = false;

    const manager = new GlobalShortcutManager({
      registrar,
      quickPasteShortcut: QUICK_PASTE_SHORTCUT,
      onQuickPasteRequested: () => {},
    });

    manager.register();

    expect(registrar.registeredAccelerator).toBeNull();

    registrar.shouldRegister = true;

    manager.register();

    expect(registrar.registeredAccelerator).toBe(QUICK_PASTE_SHORTCUT);
  });
});
