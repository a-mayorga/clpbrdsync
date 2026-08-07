import type { DatabaseSync } from "node:sqlite";

type Migration = {
  version: number;
  up(database: DatabaseSync): void;
};

const migrations: readonly Migration[] = [
  {
    version: 1,
    up(database) {
      database.exec(`
        CREATE TABLE clipboard_history (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          captured_at TEXT NOT NULL
        ) STRICT;

        CREATE INDEX clipboard_history_captured_at_idx
          ON clipboard_history(captured_at DESC);
      `);
    },
  },
];

export function runMigrations(database: DatabaseSync): void {
  const currentVersionRow = database.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };

  let currentVersion = currentVersionRow.user_version;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    database.exec("BEGIN IMMEDIATE");

    try {
      migration.up(database);
      database.exec(`PRAGMA user_version = ${migration.version}`);
      database.exec("COMMIT");

      currentVersion = migration.version;
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
}
