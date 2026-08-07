import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";

export interface ClipboardHistoryRepository {
  initialize(): void;
  findRecent(limit: number): ClipboardTextItem[];
  insert(item: ClipboardTextItem): void;
  prune(limit: number): void;
  clear(): void;
  close(): void;
}
