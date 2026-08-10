import { describe, expect, it } from "vitest";

import {
  normalizeSelectedIndex,
  selectNextIndex,
  selectPreviousIndex,
} from "./quick-paste-selection";

describe("Quick Paste selection", () => {
  it("moves to the next item", () => {
    expect(selectNextIndex(0, 3)).toBe(1);
  });

  it("does not move past the final item", () => {
    expect(selectNextIndex(2, 3)).toBe(2);
  });

  it("does not move below zero", () => {
    expect(selectPreviousIndex(0)).toBe(0);
  });

  it("moves to the previous item", () => {
    expect(selectPreviousIndex(2)).toBe(1);
  });

  it("normalizes a selection after the list shrinks", () => {
    expect(normalizeSelectedIndex(7, 3)).toBe(2);
  });

  it("returns zero for an empty list", () => {
    expect(normalizeSelectedIndex(4, 0)).toBe(0);
  });
});
