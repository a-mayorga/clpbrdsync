import { clipboard } from "electron";

import type { ClipboardReader } from "../features/clipboard/application/clipboard-reader";

export class ElectronClipboardReader implements ClipboardReader {
  readText(): string {
    return clipboard.readText();
  }
}
