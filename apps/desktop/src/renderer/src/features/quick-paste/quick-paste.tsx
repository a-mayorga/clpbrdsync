import { useEffect, useMemo, useState } from "react";

import { useClipboardHistory } from "../clipboard-history/use-clipboard-history";

const MAX_VISIBLE_ITEMS = 8;

export function QuickPaste(): React.JSX.Element {
  const { items, isLoading, errorMessage, copyItem } = useClipboardHistory();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const visibleItems = useMemo(() => items.slice(0, MAX_VISIBLE_ITEMS), [items]);

  async function selectItem(itemId: string): Promise<void> {
    await copyItem(itemId);
    await window.clpbrdSync.quickPaste.hide();
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      switch (event.key) {
        case "Escape": {
          event.preventDefault();
          void window.clpbrdSync.quickPaste.hide();
          break;
        }

        case "ArrowDown": {
          if (visibleItems.length === 0) {
            return;
          }

          event.preventDefault();
          setSelectedIndex((current) => Math.min(current + 1, visibleItems.length - 1));
          break;
        }

        case "ArrowUp": {
          if (visibleItems.length === 0) {
            return;
          }

          event.preventDefault();
          setSelectedIndex((current) => Math.max(current - 1, 0));
          break;
        }

        case "Enter": {
          const item = visibleItems[selectedIndex];

          if (!item) {
            return;
          }

          event.preventDefault();
          void selectItem(item.id);
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [copyItem, selectedIndex, visibleItems]);

  if (isLoading) {
    return (
      <main>
        <p>Loading clipboard history…</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className="quick-paste">
      <header>
        <h1>Quick Paste</h1>
      </header>

      {visibleItems.length === 0 ? (
        <p>No clipboard history yet.</p>
      ) : (
        <ol>
          {visibleItems.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => {
                  setSelectedIndex(index);
                }}
                onClick={() => {
                  void selectItem(item.id);
                }}
                aria-current={index === selectedIndex ? "true" : undefined}
              >
                {createPreview(item.content)}
              </button>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function createPreview(content: string): string {
  const preview = content.replaceAll(/\s+/g, " ").trim();

  if (preview.length <= 100) {
    return preview;
  }

  return `${preview.slice(0, 97)}...`;
}
