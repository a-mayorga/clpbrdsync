import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runMigrations } from "../../../infrastructure/database/migrations";
import { SqliteSettingsRepository } from "./sqlite-settings-repository";

describe("SqliteSettingsRepository", () => {
  let database: DatabaseSync;
  let repository: SqliteSettingsRepository;

  beforeEach(() => {
    database = new DatabaseSync(":memory:");

    runMigrations(database);

    repository = new SqliteSettingsRepository(database);

    repository.initialize();
  });

  afterEach(() => {
    repository.close();
    database.close();
  });

  it("returns null for a missing setting", () => {
    expect(repository.find("missing")).toBeNull();
  });

  it("stores and retrieves a setting", () => {
    repository.set("historyLimit", "250");

    expect(repository.find("historyLimit")).toBe("250");
  });

  it("updates an existing setting", () => {
    repository.set("historyLimit", "100");

    repository.set("historyLimit", "200");

    expect(repository.find("historyLimit")).toBe("200");
  });
});
