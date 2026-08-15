import type { ClipboardHistoryItem } from "../../../../shared/clipboard/clipboard-history-item";
import type { ClipboardHistorySnapshot } from "../../../../shared/clipboard/clipboard-history-snapshot";
import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";
import type { ClipboardHistoryRepository } from "./clipboard-history-repository";
import type { ClipboardWriteTracker } from "./clipboard-write-tracker";
import type { ClipboardWriter } from "./clipboard-writer";

type ClipboardHistoryServiceOptions = {
  maxItems?: number;
  repository: ClipboardHistoryRepository;
  clipboardWriter: ClipboardWriter;
  writeTracker: ClipboardWriteTracker;
};

type HistoryChangedHandler = (snapshot: ClipboardHistorySnapshot) => void;

export class ClipboardHistoryService {
  private readonly changeHandlers = new Set<HistoryChangedHandler>();
  private readonly clipboardWriter: ClipboardWriter;
  private readonly items: ClipboardTextItem[] = [];
  private readonly repository: ClipboardHistoryRepository;
  private readonly writeTracker: ClipboardWriteTracker;
  private maxItems: number;
  private revision = 0;

  constructor(options: ClipboardHistoryServiceOptions) {
    this.maxItems = options.maxItems ?? 100;
    this.repository = options.repository;
    this.clipboardWriter = options.clipboardWriter;
    this.writeTracker = options.writeTracker;

    if (!Number.isInteger(this.maxItems) || this.maxItems <= 0) {
      throw new Error("Clipboard history maxItems must be a positive integer.");
    }
  }

  initialize(): void {
    this.repository.initialize();

    const persistedItems = this.repository.findRecent(this.maxItems);

    this.items.length = 0;
    this.items.push(...persistedItems);
    this.revision = 1;
  }

  add(item: ClipboardTextItem): void {
    this.repository.insert(item);
    this.items.unshift(item);

    if (this.items.length > this.maxItems) {
      this.items.length = this.maxItems;
    }

    this.repository.prune(this.maxItems);
    this.revision += 1;
    this.notifyChange();
  }

  copyItem(itemId: string): void {
    const item =
      this.items.find((candidate) => candidate.id === itemId) ?? this.repository.findById(itemId);

    if (!item) {
      throw new Error(`Clipboard history item not found: ${itemId}`);
    }

    this.writeTracker.markExpectedWrite(item.contentHash);

    try {
      this.clipboardWriter.writeText(item.content);
    } catch (error) {
      this.writeTracker.clear();
      throw error;
    }
  }

  getItems(): readonly ClipboardHistoryItem[] {
    return this.items.map((item) => ({
      id: item.id,
      content: item.content,
      capturedAt: item.capturedAt,
    }));
  }

  getSnapshot(): ClipboardHistorySnapshot {
    return {
      revision: this.revision,
      items: this.getItems(),
    };
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

    this.repository.clear();
    this.items.length = 0;
    this.revision += 1;
    this.notifyChange();
  }

  dispose(): void {
    this.changeHandlers.clear();
    this.items.length = 0;
    this.repository.close();
  }

  private notifyChange(): void {
    const snapshot = this.getSnapshot();

    for (const handler of this.changeHandlers) {
      handler(snapshot);
    }
  }

  setMaxItems(maxItems: number): void {
    if (!Number.isInteger(maxItems) || maxItems <= 0) {
      throw new Error("Clipboard history maxItems must be a positive integer.");
    }

    if (maxItems === this.maxItems) {
      return;
    }

    this.maxItems = maxItems;

    if (this.items.length > maxItems) {
      this.items.length = maxItems;
    }

    this.repository.prune(maxItems);

    this.revision += 1;

    this.notifyChange();
  }
}
