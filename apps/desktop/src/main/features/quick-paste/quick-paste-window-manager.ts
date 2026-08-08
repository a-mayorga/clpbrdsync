import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { BrowserWindow, screen } from "electron";

type QuickPasteWindowManagerOptions = {
  onWindowCreated?(window: BrowserWindow): void;
};

export class QuickPasteWindowManager {
  private window: BrowserWindow | null = null;

  constructor(private readonly options: QuickPasteWindowManagerOptions = {}) {}

  async show(): Promise<void> {
    const existingWindow = this.getWindow();

    if (existingWindow) {
      this.positionWindow(existingWindow);
      existingWindow.show();
      existingWindow.focus();
      return;
    }

    const window = this.createWindow();

    this.window = window;

    this.options.onWindowCreated?.(window);

    window.on("closed", () => {
      this.window = null;
    });

    window.on("blur", () => {
      window.hide();
    });

    this.positionWindow(window);

    await this.loadWindow(window);

    window.show();
    window.focus();
  }

  hide(): void {
    const window = this.getWindow();

    if (!window) {
      return;
    }

    window.hide();
  }

  dispose(): void {
    const window = this.getWindow();

    if (!window) {
      return;
    }

    window.destroy();
    this.window = null;
  }

  getWindow(): BrowserWindow | null {
    if (!this.window || this.window.isDestroyed()) {
      return null;
    }

    return this.window;
  }

  private createWindow(): BrowserWindow {
    return new BrowserWindow({
      width: 560,
      height: 420,
      show: false,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
  }

  private async loadWindow(window: BrowserWindow): Promise<void> {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      const url = new URL(process.env.ELECTRON_RENDERER_URL);

      url.searchParams.set("window", "quick-paste");

      await window.loadURL(url.toString());
      return;
    }

    await window.loadFile(join(__dirname, "../renderer/index.html"), {
      query: {
        window: "quick-paste",
      },
    });
  }

  private positionWindow(window: BrowserWindow): void {
    const cursorPosition = screen.getCursorScreenPoint();

    const display = screen.getDisplayNearestPoint(cursorPosition);

    const { x, y, width, height } = display.workArea;

    const [windowWidth, windowHeight] = window.getSize();

    window.setPosition(
      Math.round(x + (width - windowWidth) / 2),
      Math.round(y + (height - windowHeight) / 3),
    );
  }
}
