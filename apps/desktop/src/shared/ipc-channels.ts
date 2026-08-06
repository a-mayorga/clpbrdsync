export const IPC_CHANNELS = {
  runtime: {
    getInfo: "runtime:get-info",
  },
  clipboardHistory: {
    getItems: "clipboard-history:get-items",
    changed: "clipboard-history:changed",
  },
} as const;
