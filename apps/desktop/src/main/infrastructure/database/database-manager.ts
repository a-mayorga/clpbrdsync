import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { app } from "electron";

import { runMigrations } from "./migrations";

export class DatabaseManager {
  private database: DatabaseSync | null = null;

  initialize(): DatabaseSync {
    if (this.database) {
      return this.database;
    }

    const dataDirectory = join(app.getPath("userData"), "data");

    mkdirSync(dataDirectory, {
      recursive: true,
    });

    const databasePath = join(dataDirectory, "clpbrdsync.sqlite");

    const database = new DatabaseSync(databasePath);

    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("PRAGMA busy_timeout = 5000");

    runMigrations(database);

    this.database = database;

    return database;
  }

  getDatabase(): DatabaseSync {
    if (!this.database) {
      throw new Error("DatabaseManager has not been initialized.");
    }

    return this.database;
  }

  close(): void {
    this.database?.close();
    this.database = null;
  }
}
