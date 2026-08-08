import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";
import { EventBus } from "../../../core/event-bus";
import { CLIPBOARD_EVENTS } from "../domain/clipboard-events";
import { ClipboardMonitor } from "./clipboard-monitor";
import type { ClipboardReader } from "./clipboard-reader";
import { ClipboardWriteTracker } from "./clipboard-write-tracker";

class FakeClipboardReader implements ClipboardReader {
  private content = "";

  readText(): string {
    return this.content;
  }

  setContent(content: string): void {
    this.content = content;
  }
}

describe("ClipboardMonitor", () => {
  let clipboardReader: FakeClipboardReader;
  let eventBus: EventBus;
  let monitor: ClipboardMonitor;
  let writeTracker: ClipboardWriteTracker;

  beforeEach(() => {
    vi.useFakeTimers();

    clipboardReader = new FakeClipboardReader();
    eventBus = new EventBus();
    writeTracker = new ClipboardWriteTracker();

    monitor = new ClipboardMonitor({
      clipboardReader,
      eventBus,
      writeTracker,
      pollingIntervalMs: 500,
    });
  });

  afterEach(() => {
    monitor.stop();
    eventBus.removeAllListeners();
    vi.useRealTimers();
  });

  it("does not emit the clipboard content present at startup", () => {
    const handler = vi.fn();

    clipboardReader.setContent("Existing content");
    eventBus.on(CLIPBOARD_EVENTS.textChanged, handler);

    monitor.start();

    expect(handler).not.toHaveBeenCalled();
  });

  it("emits when clipboard text changes after startup", () => {
    const items: ClipboardTextItem[] = [];

    eventBus.on<ClipboardTextItem>(CLIPBOARD_EVENTS.textChanged, (item) => {
      items.push(item);
    });

    monitor.start();

    clipboardReader.setContent("New content");
    vi.advanceTimersByTime(500);

    expect(items).toHaveLength(1);
    expect(items[0]?.content).toBe("New content");
    expect(items[0]?.contentHash).toHaveLength(64);
  });

  it("does not emit duplicate consecutive content", () => {
    const handler = vi.fn();

    eventBus.on(CLIPBOARD_EVENTS.textChanged, handler);

    monitor.start();

    clipboardReader.setContent("Repeated content");
    vi.advanceTimersByTime(500);
    vi.advanceTimersByTime(1_500);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores empty and whitespace-only content", () => {
    const handler = vi.fn();

    eventBus.on(CLIPBOARD_EVENTS.textChanged, handler);

    monitor.start();

    clipboardReader.setContent("   ");
    vi.advanceTimersByTime(500);

    expect(handler).not.toHaveBeenCalled();
  });

  it("preserves whitespace in meaningful content", () => {
    const items: ClipboardTextItem[] = [];

    eventBus.on<ClipboardTextItem>(CLIPBOARD_EVENTS.textChanged, (item) => {
      items.push(item);
    });

    monitor.start();

    clipboardReader.setContent("  const value = true;\n");
    vi.advanceTimersByTime(500);

    expect(items[0]?.content).toBe("  const value = true;\n");
  });

  it("can be started more than once without creating duplicate timers", () => {
    const handler = vi.fn();

    eventBus.on(CLIPBOARD_EVENTS.textChanged, handler);

    monitor.start();
    monitor.start();

    clipboardReader.setContent("One event");
    vi.advanceTimersByTime(500);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("stops polling", () => {
    const handler = vi.fn();

    eventBus.on(CLIPBOARD_EVENTS.textChanged, handler);

    monitor.start();
    monitor.stop();

    clipboardReader.setContent("Should not be detected");
    vi.advanceTimersByTime(1_000);

    expect(handler).not.toHaveBeenCalled();
  });
});
