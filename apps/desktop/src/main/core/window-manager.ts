import { join } from "node:path";
import { BrowserWindow, shell } from "electron";

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow;
    }

    const window = new BrowserWindow({
      width: 1100,
      height: 720,
      minWidth: 800,
      minHeight: 560,
      show: false,
      title: "ClpbrdSync",
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    window.once("ready-to-show", () => {
      window.show();
    });

    window.on("closed", () => {
      this.mainWindow = null;
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);

      return {
        action: "deny",
      };
    });

    this.mainWindow = window;

    return window;
  }

  getMainWindow(): BrowserWindow | null {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return null;
    }

    return this.mainWindow;
  }

  focusMainWindow(): void {
    const window = this.getMainWindow();

    if (!window) {
      return;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();
  }

  destroyMainWindow(): void {
    const window = this.getMainWindow();

    if (!window) {
      return;
    }

    window.destroy();
    this.mainWindow = null;
  }
}
