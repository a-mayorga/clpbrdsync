import { describe, expect, it, vi } from "vitest";

import { DEFAULT_DESKTOP_SETTINGS } from "../../../../shared/settings/desktop-settings";
import type { SettingsRepository } from "./settings-repository";
import { SettingsService } from "./settings-service";

class InMemorySettingsRepository implements SettingsRepository {
  private readonly values = new Map<string, string>();

  initialize(): void {}

  find(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }

  close(): void {}
}

describe("SettingsService", () => {
  it("uses defaults when no settings are persisted", () => {
    const repository = new InMemorySettingsRepository();

    const service = new SettingsService({
      repository,
    });

    service.initialize();

    expect(service.getSettings()).toEqual(DEFAULT_DESKTOP_SETTINGS);
  });

  it("persists an updated history limit", () => {
    const repository = new InMemorySettingsRepository();

    const service = new SettingsService({
      repository,
    });

    service.initialize();

    service.update({
      historyLimit: 250,
    });

    expect(repository.find("historyLimit")).toBe("250");
  });

  it("preserves settings not included in an update", () => {
    const repository = new InMemorySettingsRepository();

    const service = new SettingsService({
      repository,
    });

    service.initialize();

    const result = service.update({
      historyLimit: 250,
    });

    expect(result).toEqual({
      ...DEFAULT_DESKTOP_SETTINGS,
      historyLimit: 250,
    });
  });

  it("rejects an invalid history limit without persisting it", () => {
    const repository = new InMemorySettingsRepository();

    const service = new SettingsService({
      repository,
    });

    service.initialize();

    expect(() => {
      service.update({
        historyLimit: 2,
      });
    }).toThrow("History limit must be an integer between 10 and 1000.");

    expect(repository.find("historyLimit")).toBeNull();
  });

  it("notifies subscribers after settings change", () => {
    const repository = new InMemorySettingsRepository();

    const service = new SettingsService({
      repository,
    });

    service.initialize();

    const handler = vi.fn();

    service.subscribe(handler);

    service.update({
      historyLimit: 200,
    });

    expect(handler).toHaveBeenCalledWith({
      ...DEFAULT_DESKTOP_SETTINGS,
      historyLimit: 200,
    });
  });

  it("falls back when a persisted integer is invalid", () => {
    const repository = new InMemorySettingsRepository();

    repository.set("historyLimit", "not-a-number");

    const service = new SettingsService({
      repository,
    });

    service.initialize();

    expect(service.getSettings().historyLimit).toBe(DEFAULT_DESKTOP_SETTINGS.historyLimit);
  });
});
