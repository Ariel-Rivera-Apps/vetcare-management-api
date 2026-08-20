CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT owners_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS owners_created_at_idx ON owners (created_at DESC);
