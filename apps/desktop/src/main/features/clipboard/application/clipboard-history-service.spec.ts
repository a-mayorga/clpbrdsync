import { describe, expect, it, vi } from "vitest";

import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";
import type { ClipboardHistoryRepository } from "./clipboard-history-repository";
import { ClipboardHistoryService } from "./clipboard-history-service";
import { ClipboardWriteTracker } from "./clipboard-write-tracker";
import type { ClipboardWriter } from "./clipboard-writer";

class InMemoryClipboardHistoryRepository implements ClipboardHistoryRepository {
  private items: ClipboardTextItem[] = [];

  initialize(): void {}

  findRecent(limit: number): ClipboardTextItem[] {
    return this.items.slice(0, limit).map((item) => ({ ...item }));
  }

  findById(id: string): ClipboardTextItem | null {
    const item = this.items.find((candidate) => candidate.id === id);

    return item ? { ...item } : null;
  }

  insert(item: ClipboardTextItem): void {
    this.items.unshift({ ...item });
  }

  prune(limit: number): void {
    this.items.length = Math.min(this.items.length, limit);
  }

  clear(): void {
    this.items.length = 0;
  }

  close(): void {}
}

class FakeClipboardWriter implements ClipboardWriter {
  writtenContent: string | null = null;

  writeText(content: string): void {
    this.writtenContent = content;
  }
}

function createService(maxItems = 100): {
  service: ClipboardHistoryService;
  clipboardWriter: FakeClipboardWriter;
  writeTracker: ClipboardWriteTracker;
} {
  const repository = new InMemoryClipboardHistoryRepository();
  const clipboardWriter = new FakeClipboardWriter();
  const writeTracker = new ClipboardWriteTracker();

  const service = new ClipboardHistoryService({
    maxItems,
    repository,
    clipboardWriter,
    writeTracker,
  });

  return {
    service,
    clipboardWriter,
    writeTracker,
  };
}

function createItem(id: string, content: string): ClipboardTextItem {
  return {
    id,
    content,
    contentHash: `hash-${id}`,
    capturedAt: "2026-08-04T12:00:00.000Z",
  };
}

describe("ClipboardHistoryService", () => {
  it("stores newest items first", () => {
    const { service } = createService();
    service.initialize();

    service.add(createItem("1", "First"));
    service.add(createItem("2", "Second"));

    expect(service.getItems()).toEqual([
      {
        id: "2",
        content: "Second",
        capturedAt: "2026-08-04T12:00:00.000Z",
      },
      {
        id: "1",
        content: "First",
        capturedAt: "2026-08-04T12:00:00.000Z",
      },
    ]);
  });

  it("enforces its maximum size", () => {
    const { service } = createService(2);
    service.initialize();

    service.add(createItem("1", "First"));
    service.add(createItem("2", "Second"));
    service.add(createItem("3", "Third"));

    expect(service.getItems().map((item) => item.id)).toEqual(["3", "2"]);
  });

  it("notifies subscribers after an item is added", () => {
    const { service } = createService();
    service.initialize();

    const handler = vi.fn();

    service.subscribe(handler);
    service.add(createItem("1", "First"));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith([
      {
        id: "1",
        content: "First",
        capturedAt: "2026-08-04T12:00:00.000Z",
      },
    ]);
  });

  it("stops notifying a removed subscriber", () => {
    const { service } = createService();
    service.initialize();

    const handler = vi.fn();

    const unsubscribe = service.subscribe(handler);

    unsubscribe();
    service.add(createItem("1", "First"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("clears the history and notifies subscribers", () => {
    const { service } = createService();
    service.initialize();

    const handler = vi.fn();

    service.add(createItem("1", "First"));
    service.subscribe(handler);

    service.clear();

    expect(service.getItems()).toEqual([]);
    expect(handler).toHaveBeenCalledWith([]);
  });

  it("does not notify when clearing an empty history", () => {
    const { service } = createService();
    service.initialize();

    const handler = vi.fn();

    service.subscribe(handler);
    service.clear();

    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects an invalid maximum size", () => {
    expect(() => createService(0)).toThrow(
      "Clipboard history maxItems must be a positive integer.",
    );
  });

  it("restores persisted history during initialization", () => {
    const repository = new InMemoryClipboardHistoryRepository();
    const clipboardWriter = new FakeClipboardWriter();
    const writeTracker = new ClipboardWriteTracker();

    repository.insert(createItem("1", "First"));
    repository.insert(createItem("2", "Second"));

    const service = new ClipboardHistoryService({
      maxItems: 100,
      repository,
      clipboardWriter,
      writeTracker,
    });

    service.initialize();

    expect(service.getItems().map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("copies an existing history item", () => {
    const { service, clipboardWriter } = createService();

    service.initialize();
    service.add(createItem("1", "Copy me"));

    service.copyItem("1");

    expect(clipboardWriter.writtenContent).toBe("Copy me");
  });

  it("throws when copying an unknown item", () => {
    const { service } = createService();

    service.initialize();

    expect(() => {
      service.copyItem("missing");
    }).toThrow("Clipboard history item not found: missing");
  });
});
