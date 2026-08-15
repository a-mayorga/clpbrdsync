export interface SettingsRepository {
  initialize(): void;
  find(key: string): string | null;
  set(key: string, value: string): void;
  close(): void;
}
