import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runMigrations } from "../../../infrastructure/database/migrations";
import { SqliteClipboardHistoryRepository } from "../../../infrastructure/sqlite-clipboard-history-repository";

describe("SqliteClipboardHistoryRepository", () => {
  let database: DatabaseSync;
  let repository: SqliteClipboardHistoryRepository;

  beforeEach(() => {
    database = new DatabaseSync(":memory:");
    runMigrations(database);

    repository = new SqliteClipboardHistoryRepository(database);
    repository.initialize();
  });

  afterEach(() => {
    repository.close();
    database.close();
  });

  it("persists and retrieves clipboard items", () => {
    repository.insert({
      id: "item-1",
      content: "Hello",
      contentHash: "hash-1",
      capturedAt: "2026-08-06T12:00:00.000Z",
    });

    expect(repository.findRecent(100)).toEqual([
      {
        id: "item-1",
        content: "Hello",
        contentHash: "hash-1",
        capturedAt: "2026-08-06T12:00:00.000Z",
      },
    ]);
  });

  it("removes items exceeding the retention limit", () => {
    repository.insert({
      id: "1",
      content: "First",
      contentHash: "hash-1",
      capturedAt: "2026-08-06T12:00:00.000Z",
    });

    repository.insert({
      id: "2",
      content: "Second",
      contentHash: "hash-2",
      capturedAt: "2026-08-06T12:01:00.000Z",
    });

    repository.insert({
      id: "3",
      content: "Third",
      contentHash: "hash-3",
      capturedAt: "2026-08-06T12:02:00.000Z",
    });

    repository.prune(2);

    expect(repository.findRecent(100).map((item) => item.id)).toEqual(["3", "2"]);
  });

  it("clears all persisted items", () => {
    repository.insert({
      id: "1",
      content: "First",
      contentHash: "hash-1",
      capturedAt: "2026-08-06T12:00:00.000Z",
    });

    repository.clear();

    expect(repository.findRecent(100)).toEqual([]);
  });
});
