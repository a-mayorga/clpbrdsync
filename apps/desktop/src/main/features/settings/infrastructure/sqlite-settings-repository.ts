import type { DatabaseSync, StatementSync } from "node:sqlite";

import type { SettingsRepository } from "../application/settings-repository";

export class SqliteSettingsRepository implements SettingsRepository {
  private findStatement: StatementSync | null = null;

  private setStatement: StatementSync | null = null;

  constructor(private readonly database: DatabaseSync) {}

  initialize(): void {
    this.findStatement = this.database.prepare(`
      SELECT value
      FROM settings
      WHERE key = ?
    `);

    this.setStatement = this.database.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key)
      DO UPDATE SET value = excluded.value
    `);
  }

  find(key: string): string | null {
    const statement = this.requireStatement(this.findStatement, "find");

    const row = statement.get(key) as { value: string } | undefined;

    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    const statement = this.requireStatement(this.setStatement, "set");

    statement.run(key, value);
  }

  close(): void {
    this.findStatement = null;
    this.setStatement = null;
  }

  private requireStatement(statement: StatementSync | null, operation: string): StatementSync {
    if (!statement) {
      throw new Error(`Settings repository is not initialized: ${operation}.`);
    }

    return statement;
  }
}
