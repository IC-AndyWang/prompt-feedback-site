import type { CollaborationStore } from "../types";

const STORAGE_KEY = "prompt-workbench-collaboration";

const emptyStore: CollaborationStore = {
  comments: [],
  copies: [],
  changeRecords: [],
};

export function loadCollaborationStore(): CollaborationStore {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return emptyStore;
  }

  try {
    const parsed = JSON.parse(raw) as CollaborationStore;
    return {
      comments: parsed.comments ?? [],
      copies: parsed.copies ?? [],
      changeRecords: parsed.changeRecords ?? [],
    };
  } catch {
    return emptyStore;
  }
}

export function saveCollaborationStore(store: CollaborationStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
