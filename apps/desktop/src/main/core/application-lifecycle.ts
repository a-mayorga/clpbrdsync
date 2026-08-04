import { app } from "electron";

import type { TrayManager } from "./tray-manager";
import type { WindowManager } from "./window-manager";

type ApplicationLifecycleDependencies = {
  trayManager: TrayManager;
  windowManager: WindowManager;
};

export class ApplicationLifecycle {
  private isQuitting = false;

  constructor(private readonly dependencies: ApplicationLifecycleDependencies) {}

  register(): void {
    app.on("before-quit", () => {
      this.isQuitting = true;
      this.dependencies.windowManager.prepareForQuit();
    });

    app.on("will-quit", () => {
      this.dispose();
    });
  }

  quit(): void {
    if (this.isQuitting) {
      return;
    }

    this.isQuitting = true;
    this.dependencies.windowManager.prepareForQuit();
    app.quit();
  }

  private dispose(): void {
    this.dependencies.trayManager.dispose();
    this.dependencies.windowManager.destroyMainWindow();
  }
}
