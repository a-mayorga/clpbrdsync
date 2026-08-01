import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow } from "electron";

import { WindowManager } from "./core/window-manager";
import { registerRuntimeIpc, unregisterRuntimeIpc } from "./features/runtime/runtime-ipc";

const windowManager = new WindowManager();

function createWindow(): void {
  const window = windowManager.createMainWindow();

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  void window.loadFile(join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  registerRuntimeIpc();

  electronApp.setAppUserModelId("com.clpbrdsync.desktop");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      return;
    }

    windowManager.focusMainWindow();
  });
});

app.on("window-all-closed", () => {
  unregisterRuntimeIpc();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
