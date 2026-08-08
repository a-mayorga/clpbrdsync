export const IPC_CHANNELS = {
  runtime: {
    getInfo: "runtime:get-info",
  },
  clipboardHistory: {
    getItems: "clipboard-history:get-items",
    copyItem: "clipboard-history:copy-item",
    clear: "clipboard-history:clear",
    changed: "clipboard-history:changed",
  },
} as const;
