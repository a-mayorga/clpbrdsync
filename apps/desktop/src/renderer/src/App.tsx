import { useEffect, useState } from "react";

import type { DesktopRuntimeInfo } from "../../shared/desktop-api";
import { ClipboardHistoryList } from "./features/clipboard-history/clipboard-history-list";
import { useClipboardHistory } from "./features/clipboard-history/use-clipboard-history";

function App(): React.JSX.Element {
  const [runtimeInfo, setRuntimeInfo] = useState<DesktopRuntimeInfo | null>(null);
  const [runtimeErrorMessage, setRuntimeErrorMessage] = useState<string | null>(null);

  const {
    items,
    isLoading: isHistoryLoading,
    errorMessage: historyErrorMessage,
  } = useClipboardHistory();

  useEffect(() => {
    let isActive = true;

    async function loadRuntimeInfo(): Promise<void> {
      try {
        const info = await window.clpbrdSync.getRuntimeInfo();

        if (isActive) {
          setRuntimeInfo(info);
        }
      } catch {
        if (isActive) {
          setRuntimeErrorMessage("Could not load desktop runtime information.");
        }
      }
    }

    void loadRuntimeInfo();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main>
      <header>
        <h1>ClpbrdSync</h1>
        <p>Cross-platform clipboard synchronization.</p>
      </header>

      <section aria-labelledby="runtime-heading">
        <h2 id="runtime-heading">Runtime</h2>

        {runtimeErrorMessage && <p role="alert">{runtimeErrorMessage}</p>}

        {runtimeInfo && (
          <dl>
            <div>
              <dt>Platform</dt>
              <dd>{runtimeInfo.platform}</dd>
            </div>

            <div>
              <dt>Version</dt>
              <dd>{runtimeInfo.appVersion}</dd>
            </div>

            <div>
              <dt>Process started</dt>
              <dd>{runtimeInfo.processStartedAt}</dd>
            </div>
          </dl>
        )}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Clipboard history</h2>

        {historyErrorMessage && <p role="alert">{historyErrorMessage}</p>}

        {isHistoryLoading ? (
          <p>Loading clipboard history…</p>
        ) : (
          <ClipboardHistoryList items={items} />
        )}
      </section>
    </main>
  );
}

export default App;
