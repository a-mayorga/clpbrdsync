import { describe, expect, it, vi } from "vitest";

import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";
import { ClipboardHistoryService } from "./clipboard-history-service";

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
    const service = new ClipboardHistoryService();

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
    const service = new ClipboardHistoryService({
      maxItems: 2,
    });

    service.add(createItem("1", "First"));
    service.add(createItem("2", "Second"));
    service.add(createItem("3", "Third"));

    expect(service.getItems().map((item) => item.id)).toEqual(["3", "2"]);
  });

  it("notifies subscribers after an item is added", () => {
    const service = new ClipboardHistoryService();
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
    const service = new ClipboardHistoryService();
    const handler = vi.fn();

    const unsubscribe = service.subscribe(handler);

    unsubscribe();
    service.add(createItem("1", "First"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("clears the history and notifies subscribers", () => {
    const service = new ClipboardHistoryService();
    const handler = vi.fn();

    service.add(createItem("1", "First"));
    service.subscribe(handler);

    service.clear();

    expect(service.getItems()).toEqual([]);
    expect(handler).toHaveBeenCalledWith([]);
  });

  it("does not notify when clearing an empty history", () => {
    const service = new ClipboardHistoryService();
    const handler = vi.fn();

    service.subscribe(handler);
    service.clear();

    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects an invalid maximum size", () => {
    expect(
      () =>
        new ClipboardHistoryService({
          maxItems: 0,
        }),
    ).toThrow("Clipboard history maxItems must be a positive integer.");
  });
});
