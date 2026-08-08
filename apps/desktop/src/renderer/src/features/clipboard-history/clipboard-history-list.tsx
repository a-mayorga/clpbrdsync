import type { ClipboardHistoryItem } from "../../../../shared/clipboard/clipboard-history-item";

type ClipboardHistoryListProps = {
  items: readonly ClipboardHistoryItem[];
  onCopy(itemId: string): Promise<void>;
};

function formatCapturedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function createPreview(content: string): string {
  const singleLineContent = content.replaceAll(/\s+/g, " ").trim();

  if (singleLineContent.length <= 120) {
    return singleLineContent;
  }

  return `${singleLineContent.slice(0, 117)}...`;
}

export function ClipboardHistoryList({
  items,
  onCopy,
}: ClipboardHistoryListProps): React.JSX.Element {
  if (items.length === 0) {
    return <p>Copy some text to start building your local clipboard history.</p>;
  }

  return (
    <ol>
      {items.map((item) => (
        <li key={item.id}>
          <article>
            <p>{createPreview(item.content)}</p>
            <time dateTime={item.capturedAt}>{formatCapturedAt(item.capturedAt)}</time>
            <button
              type="button"
              onClick={() => {
                void onCopy(item.id);
              }}
            >
              Copy
            </button>
          </article>
        </li>
      ))}
    </ol>
  );
}
