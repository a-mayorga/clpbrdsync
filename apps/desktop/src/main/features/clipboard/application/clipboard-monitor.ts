import { randomUUID } from "node:crypto";
import type { ClipboardTextItem } from "../../../../shared/clipboard/clipboard-text-item";
import type { EventBus } from "../../../core/event-bus";
import { CLIPBOARD_EVENTS } from "../domain/clipboard-events";
import { createContentHash } from "../domain/create-content-hash";
import type { ClipboardReader } from "./clipboard-reader";

type ClipboardMonitorDependencies = {
  clipboardReader: ClipboardReader;
  eventBus: EventBus;
  pollingIntervalMs?: number;
  onError?(error: unknown): void;
};

export class ClipboardMonitor {
  private readonly pollingIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private lastContentHash: string | null = null;
  private isInitialized = false;

  constructor(private readonly dependencies: ClipboardMonitorDependencies) {
    this.pollingIntervalMs = dependencies.pollingIntervalMs ?? 500;
  }

  start(): void {
    if (this.timer) {
      return;
    }

    this.poll();

    this.timer = setInterval(() => {
      this.poll();
    }, this.pollingIntervalMs);
  }

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  reset(): void {
    this.lastContentHash = null;
    this.isInitialized = false;
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  private poll(): void {
    try {
      this.captureCurrentClipboard();
    } catch (error) {
      this.dependencies.onError?.(error);
    }
  }

  private captureCurrentClipboard(): void {
    const content = this.dependencies.clipboardReader.readText();
    const contentHash = this.hasMeaningfulContent(content) ? createContentHash(content) : null;

    if (!this.isInitialized) {
      this.lastContentHash = contentHash;
      this.isInitialized = true;
      return;
    }

    if (!contentHash || contentHash === this.lastContentHash) {
      return;
    }

    this.lastContentHash = contentHash;

    const item: ClipboardTextItem = {
      id: randomUUID(),
      content,
      contentHash,
      capturedAt: new Date().toISOString(),
    };

    this.dependencies.eventBus.emit(CLIPBOARD_EVENTS.textChanged, item);
  }

  private hasMeaningfulContent(content: string): boolean {
    return content.trim().length > 0;
  }
}
