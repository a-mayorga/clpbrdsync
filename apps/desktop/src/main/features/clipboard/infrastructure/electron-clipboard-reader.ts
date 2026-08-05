import { clipboard } from "electron";

import type { ClipboardReader } from "../application/clipboard-reader";

export class ElectronClipboardReader implements ClipboardReader {
  readText(): string {
    return clipboard.readText();
  }
}
