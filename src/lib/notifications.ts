import { useSyncExternalStore } from "react";

const MAILBOX_KEY = "manoamano.mailboxSeen";
const COLLECTION_KEY = "manoamano.collectionSeen";
const listeners = new Set<() => void>();

export type SeenState = {
  mailbox: string[];
  collection: number;
};

const empty: SeenState = { mailbox: [], collection: 0 };

function read(): SeenState {
  if (typeof window === "undefined") return empty;
  const storedMailbox = localStorage.getItem(MAILBOX_KEY);
  let mailbox: string[] = [];
  if (storedMailbox) {
    try {
      const parsed: unknown = JSON.parse(storedMailbox);
      mailbox = Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [storedMailbox]; // Preserve the previous single-transit format.
    } catch {
      mailbox = [storedMailbox];
    }
  }
  return {
    mailbox,
    collection: Number(localStorage.getItem(COLLECTION_KEY) ?? 0),
  };
}

let snapshot: SeenState = read();

function refresh() {
  snapshot = read();
  for (const listener of listeners) listener();
}

export function markMailboxSeen(transitIds: string | string[]) {
  const ids = Array.isArray(transitIds) ? transitIds : [transitIds];
  const next = [...new Set([...snapshot.mailbox, ...ids])];
  if (next.length === snapshot.mailbox.length) return;
  localStorage.setItem(MAILBOX_KEY, JSON.stringify(next));
  refresh();
}

export function markCollectionSeen(upTo: number) {
  if (upTo <= snapshot.collection) return;
  localStorage.setItem(COLLECTION_KEY, String(upTo));
  refresh();
}

export function useSeenState(): SeenState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => empty
  );
}
