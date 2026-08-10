export function selectNextIndex(currentIndex: number, itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }

  return Math.min(currentIndex + 1, itemCount - 1);
}

export function selectPreviousIndex(currentIndex: number): number {
  return Math.max(currentIndex - 1, 0);
}

export function normalizeSelectedIndex(currentIndex: number, itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(currentIndex, 0), itemCount - 1);
}
