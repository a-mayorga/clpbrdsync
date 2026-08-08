import { describe, expect, it } from "vitest";

import { ClipboardWriteTracker } from "./clipboard-write-tracker";

describe("ClipboardWriteTracker", () => {
  it("consumes an expected write once", () => {
    const tracker = new ClipboardWriteTracker();

    tracker.markExpectedWrite("hash-1");

    expect(tracker.consumeIfExpected("hash-1")).toBe(true);
    expect(tracker.consumeIfExpected("hash-1")).toBe(false);
  });

  it("does not consume a different hash", () => {
    const tracker = new ClipboardWriteTracker();

    tracker.markExpectedWrite("hash-1");

    expect(tracker.consumeIfExpected("hash-2")).toBe(false);
    expect(tracker.consumeIfExpected("hash-1")).toBe(true);
  });

  it("clears an expected write", () => {
    const tracker = new ClipboardWriteTracker();

    tracker.markExpectedWrite("hash-1");
    tracker.clear();

    expect(tracker.consumeIfExpected("hash-1")).toBe(false);
  });
});
