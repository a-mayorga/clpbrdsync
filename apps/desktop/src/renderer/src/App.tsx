import { useEffect, useState } from "react";

import type { DesktopRuntimeInfo } from "../../shared/desktop-api";

function App(): React.JSX.Element {
  const [runtimeInfo, setRuntimeInfo] = useState<DesktopRuntimeInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          setErrorMessage("Could not load desktop runtime information.");
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
      <h1>ClpbrdSync</h1>
      <p>Cross-platform clipboard synchronization.</p>

      {errorMessage && <p role="alert">{errorMessage}</p>}

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
        </dl>
      )}
    </main>
  );
}

export default App;
