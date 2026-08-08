import { useCallback, useEffect, useState } from "react";

import type { ClipboardHistoryItem } from "../../../../shared/clipboard/clipboard-history-item";

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

  useEffect(() => {
    let isActive = true;

    const unsubscribe = window.clpbrdSync.clipboardHistory.onChanged((nextItems) => {
      if (isActive) {
        setItems(nextItems);
      }
    });

    async function loadInitialHistory(): Promise<void> {
      try {
        const initialItems = await window.clpbrdSync.clipboardHistory.getItems();

        if (isActive) {
          setItems(initialItems);
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

  return {
    items,
    isLoading,
    errorMessage,
    copyItem,
    clearHistory,
  };
}
