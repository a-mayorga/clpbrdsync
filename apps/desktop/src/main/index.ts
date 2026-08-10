import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, powerMonitor } from "electron";

import type { ClipboardTextItem } from "../shared/clipboard/clipboard-text-item";
import { ApplicationLifecycle } from "./core/application-lifecycle";
import { EventBus } from "./core/event-bus";
import { GlobalShortcutManager } from "./core/global-shortcut-manager";
import { RendererRegistry } from "./core/renderer-registry";
import { TrayManager } from "./core/tray-manager";
import { WindowManager } from "./core/window-manager";
import { ClipboardHistoryService } from "./features/clipboard/application/clipboard-history-service";
import { ClipboardMonitor } from "./features/clipboard/application/clipboard-monitor";
import { ClipboardWriteTracker } from "./features/clipboard/application/clipboard-write-tracker";
import { CLIPBOARD_EVENTS } from "./features/clipboard/domain/clipboard-events";
import { ElectronClipboardWriter } from "./features/clipboard/infrastructure/electron-clipboard-writer";
import { ClipboardHistoryIpc } from "./features/clipboard/presentation/clipboard-history-ipc";
import { QuickPasteIpc } from "./features/quick-paste/quick-paste-ipc";
import { QuickPasteWindowManager } from "./features/quick-paste/quick-paste-window-manager";
import { registerRuntimeIpc, unregisterRuntimeIpc } from "./features/runtime/runtime-ipc";
import { DatabaseManager } from "./infrastructure/database/database-manager";
import { ElectronClipboardReader } from "./infrastructure/electron-clipboard-reader";
import { ElectronGlobalShortcutRegistrar } from "./infrastructure/electron-global-shortcut-registrar";
import { SqliteClipboardHistoryRepository } from "./infrastructure/sqlite-clipboard-history-repository";

const rendererRegistry = new RendererRegistry();

const windowManager = new WindowManager({
  onLoad: async (window) => {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      await window.loadURL(process.env.ELECTRON_RENDERER_URL);
      return;
    }

    await window.loadFile(join(__dirname, "../renderer/index.html"));
  },

  onWindowCreated: (window) => {
    rendererRegistry.add(window);
  },
});

const eventBus = new EventBus();
const databaseManager = new DatabaseManager();
const clipboardWriteTracker = new ClipboardWriteTracker();
const clipboardMonitor = new ClipboardMonitor({
  clipboardReader: new ElectronClipboardReader(),
  writeTracker: clipboardWriteTracker,
  eventBus,
  pollingIntervalMs: 500,
  onError: (error) => {
    console.error("Clipboard monitor failed:", error);
  },
});

let clipboardHistoryService: ClipboardHistoryService | null = null;
let clipboardHistoryIpc: ClipboardHistoryIpc | null = null;
let unsubscribeClipboardHistory: (() => void) | null = null;
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

const quickPasteWindowManager = new QuickPasteWindowManager({
  onWindowCreated: (window) => {
    rendererRegistry.add(window);
  },
});

const globalShortcutManager = new GlobalShortcutManager({
  registrar: new ElectronGlobalShortcutRegistrar(),

  onQuickPasteRequested: () => {
    void quickPasteWindowManager.show().catch((error: unknown) => {
      console.error("Could not show Quick Paste:", error);
    });
  },
});

const quickPasteIpc = new QuickPasteIpc({
  windowManager: quickPasteWindowManager,
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
    quickPasteIpc.register();
    globalShortcutManager.register();
    const database = databaseManager.initialize();
    const historyRepository = new SqliteClipboardHistoryRepository(database);

    clipboardHistoryService = new ClipboardHistoryService({
      maxItems: 100,
      repository: historyRepository,
      clipboardWriter: new ElectronClipboardWriter(),
      writeTracker: clipboardWriteTracker,
    });

    clipboardHistoryService.initialize();

    clipboardHistoryIpc = new ClipboardHistoryIpc({
      historyService: clipboardHistoryService,
      broadcast: (channel, ...args) => {
        rendererRegistry.broadcast(channel, ...args);
      },
    });

    clipboardHistoryIpc.register();

    unsubscribeClipboardHistory = eventBus.on<ClipboardTextItem>(
      CLIPBOARD_EVENTS.textChanged,
      (item) => {
        clipboardHistoryService?.add(item);
      },
    );

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
  globalShortcutManager.unregister();
  quickPasteIpc.unregister();
  quickPasteWindowManager.dispose();

  clipboardMonitor.stop();

  clipboardWriteTracker.clear();

  clipboardHistoryIpc?.unregister();
  clipboardHistoryIpc = null;

  unsubscribeClipboardHistory?.();
  unsubscribeClipboardHistory = null;

  clipboardHistoryService?.dispose();
  clipboardHistoryService = null;

  eventBus.removeAllListeners();
  unregisterRuntimeIpc();

  databaseManager.close();
});

powerMonitor.on("suspend", () => {
  clipboardMonitor.stop();
});

powerMonitor.on("resume", () => {
  clipboardMonitor.reset();
  clipboardMonitor.start();
});
