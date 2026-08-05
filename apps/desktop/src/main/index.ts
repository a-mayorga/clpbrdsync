import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, powerMonitor } from "electron";

import { ApplicationLifecycle } from "./core/application-lifecycle";
import { EventBus } from "./core/event-bus";
import { TrayManager } from "./core/tray-manager";
import { WindowManager } from "./core/window-manager";
import { ClipboardMonitor } from "./features/clipboard/application/clipboard-monitor";
import { CLIPBOARD_EVENTS } from "./features/clipboard/domain/clipboard-events";
import type { ClipboardTextItem } from "./features/clipboard/domain/clipboard-text-item";
import { ElectronClipboardReader } from "./features/clipboard/infrastructure/electron-clipboard-reader";
import { registerRuntimeIpc, unregisterRuntimeIpc } from "./features/runtime/runtime-ipc";

const windowManager = new WindowManager({
  onLoad: async (window) => {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      await window.loadURL(process.env.ELECTRON_RENDERER_URL);
      return;
    }

    await window.loadFile(join(__dirname, "../renderer/index.html"));
  },
});

const eventBus = new EventBus();

const clipboardMonitor = new ClipboardMonitor({
  clipboardReader: new ElectronClipboardReader(),
  eventBus,
  pollingIntervalMs: 500,
  onError: (error) => {
    console.error("Clipboard monitor failed:", error);
  },
});

const unsubscribeClipboardLog = eventBus.on<ClipboardTextItem>(
  CLIPBOARD_EVENTS.textChanged,
  (item) => {
    console.info("Clipboard text changed:", {
      preview: item.content.slice(0, 80),
      contentLength: item.content.length,
      contentHash: item.contentHash,
      capturedAt: item.capturedAt,
    });
  },
);

let applicationLifecycle: ApplicationLifecycle | null = null;

const trayManager = new TrayManager({
  onToggleWindow: () => {
    const existingWindow = windowManager.getMainWindow();

    if (existingWindow) {
      windowManager.toggleMainWindow();
      return;
    }

    void windowManager.createMainWindow();
  },

  onShowWindow: () => {
    const existingWindow = windowManager.getMainWindow();

    if (existingWindow) {
      windowManager.showMainWindow();
      return;
    }

    void windowManager.createMainWindow();
  },

  onQuit: () => {
    applicationLifecycle?.quit();
  },
});

applicationLifecycle = new ApplicationLifecycle({
  trayManager,
  windowManager,
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const existingWindow = windowManager.getMainWindow();

    if (existingWindow) {
      windowManager.showMainWindow();
      return;
    }

    void windowManager.createMainWindow();
  });

  app.whenReady().then(async () => {
    clipboardMonitor.start();
    electronApp.setAppUserModelId("com.clpbrdsync.desktop");

    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    registerRuntimeIpc();
    applicationLifecycle?.register();
    trayManager.initialize();

    await windowManager.createMainWindow();

    app.on("activate", () => {
      const existingWindow = windowManager.getMainWindow();

      if (existingWindow) {
        windowManager.showMainWindow();
        return;
      }

      void windowManager.createMainWindow();
    });
  });
}

app.on("window-all-closed", () => {
  // Intentionally empty.
  //
  // ClpbrdSync continues running in the background through the system tray.
});

app.on("will-quit", () => {
  clipboardMonitor.stop();
  unsubscribeClipboardLog();
  eventBus.removeAllListeners();
  unregisterRuntimeIpc();
});

powerMonitor.on("suspend", () => {
  clipboardMonitor.stop();
});

powerMonitor.on("resume", () => {
  clipboardMonitor.reset();
  clipboardMonitor.start();
});
