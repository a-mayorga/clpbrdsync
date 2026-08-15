import { useEffect, useState } from "react";

import { useSettings } from "./use-settings";

type SettingsPanelProps = {
  historyItemCount: number;
};

export function SettingsPanel({ historyItemCount }: SettingsPanelProps): React.JSX.Element {
  const { settings, isLoading, errorMessage, updateSettings } = useSettings();
  const [historyLimitInput, setHistoryLimitInput] = useState("");

  useEffect(() => {
    if (settings) {
      setHistoryLimitInput(String(settings.historyLimit));
    }
  }, [settings]);

  if (isLoading) {
    return (
      <section>
        <h2>Settings</h2>
        <p>Loading settings…</p>
      </section>
    );
  }

  if (!settings) {
    return (
      <section>
        <h2>Settings</h2>
        <p role="alert">{errorMessage ?? "Settings unavailable."}</p>
      </section>
    );
  }

  async function saveHistoryLimit(): Promise<void> {
    const nextHistoryLimit = Number(historyLimitInput);

    if (!Number.isInteger(nextHistoryLimit) || nextHistoryLimit < 10 || nextHistoryLimit > 1000) {
      return;
    }

    if (nextHistoryLimit < historyItemCount) {
      const confirmed = window.confirm(
        `Reducing the history limit to ${nextHistoryLimit} will permanently remove older items. Continue?`,
      );

      if (!confirmed) {
        return;
      }
    }

    await updateSettings({
      historyLimit: nextHistoryLimit,
    });
  }

  return (
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading">Settings</h2>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <fieldset>
        <legend>Clipboard history</legend>

        <label>
          Keep
          <input
            type="number"
            min={10}
            max={1000}
            step={1}
            value={historyLimitInput}
            onChange={(event) => {
              setHistoryLimitInput(event.target.value);
            }}
          />
          items
        </label>

        <button
          type="button"
          onClick={() => {
            void saveHistoryLimit();
          }}
        >
          Save
        </button>
      </fieldset>

      <fieldset>
        <legend>Quick Paste</legend>

        <dl>
          <div>
            <dt>Shortcut</dt>
            <dd>{settings.quickPasteShortcut}</dd>
          </div>
        </dl>
      </fieldset>

      <fieldset>
        <legend>Advanced</legend>

        <dl>
          <div>
            <dt>Clipboard polling interval</dt>
            <dd>{settings.clipboardPollingIntervalMs} ms</dd>
          </div>
        </dl>
      </fieldset>
    </section>
  );
}
