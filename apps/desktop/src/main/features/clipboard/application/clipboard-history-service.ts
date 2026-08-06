import type { ClipboardHistoryItem } from "../../../../shared/clipboard/clipboard-history-item";
import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";

type ClipboardHistoryServiceOptions = {
  maxItems?: number;
};

type HistoryChangedHandler = (items: readonly ClipboardHistoryItem[]) => void;

export class ClipboardHistoryService {
  private readonly maxItems: number;

  private readonly items: ClipboardTextItem[] = [];

  private readonly changeHandlers = new Set<HistoryChangedHandler>();

  constructor(options: ClipboardHistoryServiceOptions = {}) {
    this.maxItems = options.maxItems ?? 100;

    if (!Number.isInteger(this.maxItems) || this.maxItems <= 0) {
      throw new Error("Clipboard history maxItems must be a positive integer.");
    }
  }

  add(item: ClipboardTextItem): void {
    this.items.unshift(item);

    if (this.items.length > this.maxItems) {
      this.items.length = this.maxItems;
    }

    this.notifyChange();
  }

  getItems(): readonly ClipboardHistoryItem[] {
    return this.items.map((item) => ({
      id: item.id,
      content: item.content,
      capturedAt: item.capturedAt,
    }));
  }

  subscribe(handler: HistoryChangedHandler): () => void {
    this.changeHandlers.add(handler);

    return () => {
      this.changeHandlers.delete(handler);
    };
  }

  clear(): void {
    if (this.items.length === 0) {
      return;
    }

    this.items.length = 0;
    this.notifyChange();
  }

  dispose(): void {
    this.items.length = 0;
    this.changeHandlers.clear();
  }

  private notifyChange(): void {
    const snapshot = this.getItems();

    for (const handler of this.changeHandlers) {
      handler(snapshot);
    }
  }
}
