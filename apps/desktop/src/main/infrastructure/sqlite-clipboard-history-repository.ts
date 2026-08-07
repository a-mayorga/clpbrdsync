import type { DatabaseSync, StatementSync } from "node:sqlite";

import type { ClipboardTextItem } from "../../shared/clipboard/clipboard-text-item";
import type { ClipboardHistoryRepository } from "../features/clipboard/application/clipboard-history-repository";

type ClipboardHistoryRow = {
  id: string;
  content: string;
  content_hash: string;
  captured_at: string;
};

export class SqliteClipboardHistoryRepository implements ClipboardHistoryRepository {
  private insertStatement: StatementSync | null = null;

  private findRecentStatement: StatementSync | null = null;

  private deleteOverflowStatement: StatementSync | null = null;

  private clearStatement: StatementSync | null = null;

  constructor(private readonly database: DatabaseSync) {}

  initialize(): void {
    this.insertStatement = this.database.prepare(`
      INSERT INTO clipboard_history (
        id,
        content,
        content_hash,
        captured_at
      )
      VALUES (?, ?, ?, ?)
    `);

    this.findRecentStatement = this.database.prepare(`
      SELECT
        id,
        content,
        content_hash,
        captured_at
      FROM clipboard_history
      ORDER BY captured_at DESC, rowid DESC
      LIMIT ?
    `);

    this.deleteOverflowStatement = this.database.prepare(`
      DELETE FROM clipboard_history
      WHERE id IN (
        SELECT id
        FROM clipboard_history
        ORDER BY captured_at DESC, rowid DESC
        LIMIT -1 OFFSET ?
      )
    `);

    this.clearStatement = this.database.prepare(`
      DELETE FROM clipboard_history
    `);
  }

  findRecent(limit: number): ClipboardTextItem[] {
    const statement = this.requireStatement(this.findRecentStatement, "findRecent");

    const rows = statement.all(limit) as ClipboardHistoryRow[];

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      contentHash: row.content_hash,
      capturedAt: row.captured_at,
    }));
  }

  insert(item: ClipboardTextItem): void {
    const statement = this.requireStatement(this.insertStatement, "insert");

    statement.run(item.id, item.content, item.contentHash, item.capturedAt);
  }

  prune(limit: number): void {
    const statement = this.requireStatement(this.deleteOverflowStatement, "prune");

    statement.run(limit);
  }

  clear(): void {
    const statement = this.requireStatement(this.clearStatement, "clear");

    statement.run();
  }

  close(): void {
    this.insertStatement = null;
    this.findRecentStatement = null;
    this.deleteOverflowStatement = null;
    this.clearStatement = null;
  }

  private requireStatement(statement: StatementSync | null, operation: string): StatementSync {
    if (!statement) {
      throw new Error(`Clipboard history repository is not initialized: ${operation}.`);
    }

    return statement;
  }
}
