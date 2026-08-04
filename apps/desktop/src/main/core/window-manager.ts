import { join } from "node:path";
import { BrowserWindow, type Event, shell } from "electron";

type WindowManagerOptions = {
  onLoad(window: BrowserWindow): Promise<void>;
};

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  private isQuitting = false;

  constructor(private readonly options: WindowManagerOptions) {}

  async createMainWindow(): Promise<BrowserWindow> {
    const existingWindow = this.getMainWindow();

    if (existingWindow) {
      this.showMainWindow();

      return existingWindow;
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

    window.on("close", (event) => {
      this.handleWindowClose(event);
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

    await this.options.onLoad(window);

    return window;
  }

  getMainWindow(): BrowserWindow | null {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return null;
    }

    return this.mainWindow;
  }

  showMainWindow(): void {
    const window = this.getMainWindow();

    if (!window) {
      return;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.show();
    window.focus();
  }

  hideMainWindow(): void {
    const window = this.getMainWindow();

    if (!window) {
      return;
    }

    window.hide();
  }

  toggleMainWindow(): void {
    const window = this.getMainWindow();

    if (!window) {
      return;
    }

    if (window.isVisible()) {
      this.hideMainWindow();
      return;
    }

    this.showMainWindow();
  }

  prepareForQuit(): void {
    this.isQuitting = true;
  }

  destroyMainWindow(): void {
    const window = this.getMainWindow();

    if (!window) {
      return;
    }

    this.isQuitting = true;
    window.destroy();
    this.mainWindow = null;
  }

  private handleWindowClose(event: Event): void {
    if (this.isQuitting) {
      return;
    }

    event.preventDefault();
    this.hideMainWindow();
  }
}
