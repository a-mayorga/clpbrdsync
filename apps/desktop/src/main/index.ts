import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app } from "electron";

import { ApplicationLifecycle } from "./core/application-lifecycle";
import { TrayManager } from "./core/tray-manager";
import { WindowManager } from "./core/window-manager";
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
  unregisterRuntimeIpc();
});
