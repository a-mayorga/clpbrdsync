export interface GlobalShortcutRegistrar {
  register(accelerator: string, callback: () => void): boolean;

  unregister(accelerator: string): void;
}
