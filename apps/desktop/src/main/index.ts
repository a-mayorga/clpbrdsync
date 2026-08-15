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
import { SettingsService } from "./features/settings/application/settings-service";
import { SqliteSettingsRepository } from "./features/settings/infrastructure/sqlite-settings-repository";
import { SettingsIpc } from "./features/settings/presentation/settings-ipc";
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

let clipboardHistoryService: ClipboardHistoryService | null = null;
let clipboardHistoryIpc: ClipboardHistoryIpc | null = null;
let unsubscribeClipboardHistory: (() => void) | null = null;
let applicationLifecycle: ApplicationLifecycle | null = null;
let settingsService: SettingsService | null = null;
let settingsIpc: SettingsIpc | null = null;
let unsubscribeSettings: (() => void) | null = null;
let clipboardMonitor: ClipboardMonitor | null = null;
let globalShortcutManager: GlobalShortcutManager | null = null;

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
    const database = databaseManager.initialize();
    const settingsRepository = new SqliteSettingsRepository(database);

    settingsService = new SettingsService({
      repository: settingsRepository,
    });

    settingsService.initialize();

    const settings = settingsService.getSettings();

    settingsIpc = new SettingsIpc({
      settingsService,
      broadcast: (channel, ...args) => {
        rendererRegistry.broadcast(channel, ...args);
      },
    });

    settingsIpc.register();

    clipboardMonitor = new ClipboardMonitor({
      clipboardReader: new ElectronClipboardReader(),
      eventBus,
      writeTracker: clipboardWriteTracker,
      pollingIntervalMs: settings.clipboardPollingIntervalMs,
      onError: (error) => {
        console.error("Clipboard monitor failed:", error);
      },
    });

    clipboardMonitor.start();

    globalShortcutManager = new GlobalShortcutManager({
      registrar: new ElectronGlobalShortcutRegistrar(),
      quickPasteShortcut: settings.quickPasteShortcut,
      onQuickPasteRequested: () => {
        void quickPasteWindowManager.show().catch((error: unknown) => {
          console.error("Could not show Quick Paste:", error);
        });
      },
    });

    globalShortcutManager.register();

    const historyRepository = new SqliteClipboardHistoryRepository(database);

    clipboardHistoryService = new ClipboardHistoryService({
      maxItems: settings.historyLimit,
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

    unsubscribeSettings = settingsService.subscribe((nextSettings) => {
      clipboardHistoryService?.setMaxItems(nextSettings.historyLimit);
    });

    unsubscribeClipboardHistory = eventBus.on<ClipboardTextItem>(
      CLIPBOARD_EVENTS.textChanged,
      (item) => {
        clipboardHistoryService?.add(item);
      },
    );

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
  clipboardMonitor?.stop();
  clipboardMonitor = null;

  globalShortcutManager?.unregister();
  globalShortcutManager = null;

  quickPasteIpc.unregister();
  quickPasteWindowManager.dispose();

  clipboardHistoryIpc?.unregister();
  clipboardHistoryIpc = null;

  unsubscribeClipboardHistory?.();
  unsubscribeClipboardHistory = null;

  unsubscribeSettings?.();
  unsubscribeSettings = null;

  settingsIpc?.unregister();
  settingsIpc = null;

  clipboardHistoryService?.dispose();
  clipboardHistoryService = null;

  settingsService?.dispose();
  settingsService = null;

  clipboardWriteTracker.clear();

  rendererRegistry.clear();
  eventBus.removeAllListeners();

  unregisterRuntimeIpc();

  databaseManager.close();
});

powerMonitor.on("suspend", () => {
  clipboardMonitor?.stop();
});

powerMonitor.on("resume", () => {
  clipboardMonitor?.reset();
  clipboardMonitor?.start();
});
