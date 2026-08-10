import type { ClipboardHistoryItem } from "./clipboard-history-item";

export type ClipboardHistorySnapshot = {
  revision: number;
  items: readonly ClipboardHistoryItem[];
};
