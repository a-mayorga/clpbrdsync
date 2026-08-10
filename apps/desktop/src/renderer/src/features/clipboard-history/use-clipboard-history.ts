import { useCallback, useEffect, useRef, useState } from "react";

import type { ClipboardHistoryItem } from "../../../../shared/clipboard/clipboard-history-item";
import type { ClipboardHistorySnapshot } from "../../../../shared/clipboard/clipboard-history-snapshot";

type ClipboardHistoryState = {
  items: readonly ClipboardHistoryItem[];
  isLoading: boolean;
  errorMessage: string | null;
  copyItem(itemId: string): Promise<void>;
  clearHistory(): Promise<void>;
};

export function useClipboardHistory(): ClipboardHistoryState {
  const [items, setItems] = useState<readonly ClipboardHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentRevisionRef = useRef(-1);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = window.clpbrdSync.clipboardHistory.onChanged(applySnapshot);

    async function loadInitialHistory(): Promise<void> {
      try {
        const snapshot = await window.clpbrdSync.clipboardHistory.getSnapshot();

        if (isActive) {
          applySnapshot(snapshot);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Could not load clipboard history.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialHistory();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const copyItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      setErrorMessage(null);
      await window.clpbrdSync.clipboardHistory.copyItem(itemId);
    } catch {
      setErrorMessage("Could not copy the selected history item.");
    }
  }, []);

  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      setErrorMessage(null);
      await window.clpbrdSync.clipboardHistory.clear();
    } catch {
      setErrorMessage("Could not clear clipboard history.");
    }
  }, []);

  const applySnapshot = useCallback((snapshot: ClipboardHistorySnapshot): void => {
    if (snapshot.revision < currentRevisionRef.current) {
      return;
    }

    currentRevisionRef.current = snapshot.revision;

    setItems(snapshot.items);
  }, []);

  return {
    items,
    isLoading,
    errorMessage,
    copyItem,
    clearHistory,
  };
}
