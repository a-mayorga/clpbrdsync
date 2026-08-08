export class ClipboardWriteTracker {
  private expectedContentHash: string | null = null;

  markExpectedWrite(contentHash: string): void {
    this.expectedContentHash = contentHash;
  }

  consumeIfExpected(contentHash: string): boolean {
    if (this.expectedContentHash !== contentHash) {
      return false;
    }

    this.expectedContentHash = null;

    return true;
  }

  clear(): void {
    this.expectedContentHash = null;
  }
}
