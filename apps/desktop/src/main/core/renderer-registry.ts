import type { BrowserWindow } from "electron";

export class RendererRegistry {
  private readonly windows = new Set<BrowserWindow>();

  add(window: BrowserWindow): void {
    this.windows.add(window);

    window.once("closed", () => {
      this.windows.delete(window);
    });
  }

  broadcast(channel: string, ...args: unknown[]): void {
    for (const window of this.windows) {
      if (window.isDestroyed()) {
        this.windows.delete(window);
        continue;
      }

      window.webContents.send(channel, ...args);
    }
  }

  clear(): void {
    this.windows.clear();
  }
}
