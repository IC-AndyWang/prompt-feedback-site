import type { CollaborationStore } from "../types";

const LEGACY_STORAGE_KEY = "prompt-workbench-collaboration";
const STORAGE_KEY_PREFIX = `${LEGACY_STORAGE_KEY}:user:`;

export function createEmptyCollaborationStore(): CollaborationStore {
  return {
    comments: [],
    copies: [],
    changeRecords: [],
  };
}

function parseStore(raw: string | null): CollaborationStore | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CollaborationStore;
    return {
      comments: parsed.comments ?? [],
      copies: parsed.copies ?? [],
      changeRecords: parsed.changeRecords ?? [],
    };
  } catch {
    return null;
  }
}

function getScopedStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function loadCollaborationStore(userId: string): CollaborationStore {
  const scopedStore = parseStore(
    window.localStorage.getItem(getScopedStorageKey(userId)),
  );
  if (scopedStore) {
    return scopedStore;
  }

  const legacyStore = parseStore(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacyStore) {
    window.localStorage.setItem(
      getScopedStorageKey(userId),
      JSON.stringify(legacyStore),
    );
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return legacyStore;
  }

  return createEmptyCollaborationStore();
}

export function saveCollaborationStore(userId: string, store: CollaborationStore) {
  window.localStorage.setItem(getScopedStorageKey(userId), JSON.stringify(store));
}
