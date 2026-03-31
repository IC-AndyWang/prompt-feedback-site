CREATE TABLE IF NOT EXISTS prompt_copies (
  id TEXT PRIMARY KEY,
  base_document_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  name TEXT NOT NULL,
  module_overrides_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_copies_owner_document
  ON prompt_copies(owner_id, base_document_id);

CREATE INDEX IF NOT EXISTS idx_prompt_copies_owner_updated
  ON prompt_copies(owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS copy_changes (
  id TEXT PRIMARY KEY,
  copy_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  module_title TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  before_text TEXT NOT NULL,
  after_text TEXT NOT NULL,
  summary TEXT NOT NULL,
  FOREIGN KEY (copy_id) REFERENCES prompt_copies(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_copy_changes_copy_timestamp
  ON copy_changes(copy_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_copy_changes_author_timestamp
  ON copy_changes(author_id, timestamp DESC);
