export const IPC_CHANNELS = {
  runtime: {
    getInfo: "runtime:get-info",
  },
  clipboardHistory: {
    getSnapshot: "clipboard-history:get-snapshot",
    copyItem: "clipboard-history:copy-item",
    clear: "clipboard-history:clear",
    changed: "clipboard-history:changed",
  },
  quickPaste: {
    hide: "quick-paste:hide",
  },
  settings: {
    get: "settings:get",
    update: "settings:update",
    changed: "settings:changed",
  },
} as const;
