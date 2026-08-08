import { clipboard } from "electron";

import type { ClipboardWriter } from "../application/clipboard-writer";

export class ElectronClipboardWriter implements ClipboardWriter {
  writeText(content: string): void {
    clipboard.writeText(content);
  }
}
