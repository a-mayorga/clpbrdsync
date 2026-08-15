import { useCallback, useEffect, useState } from "react";

import type {
  DesktopSettings,
  DesktopSettingsUpdate,
} from "../../../../shared/settings/desktop-settings";

type SettingsState = {
  settings: DesktopSettings | null;
  isLoading: boolean;
  errorMessage: string | null;
  updateSettings(update: DesktopSettingsUpdate): Promise<void>;
};

export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<DesktopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = window.clpbrdSync.settings.onChanged((nextSettings) => {
      if (isActive) {
        setSettings(nextSettings);
      }
    });

    async function loadSettings(): Promise<void> {
      try {
        const initialSettings = await window.clpbrdSync.settings.get();

        if (isActive) {
          setSettings(initialSettings);
        }
      } catch (error) {
        console.error("Could not load settings:", error);
        if (isActive) {
          setErrorMessage("Could not load settings.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const updateSettings = useCallback(async (update: DesktopSettingsUpdate): Promise<void> => {
    try {
      setErrorMessage(null);

      const updatedSettings = await window.clpbrdSync.settings.update(update);

      setSettings(updatedSettings);
    } catch {
      setErrorMessage("Could not update settings.");
    }
  }, []);

  return {
    settings,
    isLoading,
    errorMessage,
    updateSettings,
  };
}
