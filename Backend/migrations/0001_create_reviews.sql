CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY NOT NULL,
  author_name TEXT NOT NULL CHECK (length(author_name) BETWEEN 1 AND 80),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 2000),
  submitter_key TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at INTEGER,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS reviews_submitter_submitted_at
  ON reviews (submitter_key, submitted_at);

CREATE INDEX IF NOT EXISTS reviews_status_submitted_at
  ON reviews (status, submitted_at DESC);
