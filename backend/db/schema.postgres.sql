-- backend/db/schema.postgres.sql

-- 1) ARTICLES
CREATE TABLE IF NOT EXISTS articles (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  source          TEXT,
  source_domain   TEXT,
  country         VARCHAR(2) NOT NULL,
  region          TEXT,
  language        VARCHAR(8) NOT NULL,
  categories      TEXT[] DEFAULT '{}',
  raw_html        TEXT,
  raw_text        TEXT,
  thumbnail_url   TEXT,
  description     TEXT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_country ON articles(country);
CREATE INDEX IF NOT EXISTS idx_articles_region ON articles(region);
CREATE INDEX IF NOT EXISTS idx_articles_language ON articles(language);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);

-- 2) SUMMARIES
CREATE TABLE IF NOT EXISTS summaries (
  id                        TEXT PRIMARY KEY,
  article_id                TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  mode                      TEXT NOT NULL, -- 'brief', 'detailed', 'humor', 'simple'
  text                      TEXT NOT NULL,
  hook                      TEXT,
  question                  TEXT,
  language                  VARCHAR(8) NOT NULL,
  approx_duration_seconds   INTEGER,
  tags                      TEXT[] DEFAULT '{}',
  provider                  TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_summaries_article_id ON summaries(article_id);
CREATE INDEX IF NOT EXISTS idx_summaries_language ON summaries(language);
CREATE INDEX IF NOT EXISTS idx_summaries_mode ON summaries(mode);

-- 3) AUDIO ASSETS
CREATE TABLE IF NOT EXISTS audio_assets (
  id                TEXT PRIMARY KEY,
  article_id        TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  summary_id        TEXT NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  type              TEXT NOT NULL, -- 'single' or 'digest'
  url               TEXT NOT NULL,
  s3_key            TEXT,
  language          VARCHAR(8) NOT NULL,
  voice_id          TEXT NOT NULL,
  persona           TEXT NOT NULL,
  provider          TEXT,
  duration_seconds  INTEGER,
  size_bytes        BIGINT,
  waveform_json     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audio_article_id ON audio_assets(article_id);
CREATE INDEX IF NOT EXISTS idx_audio_summary_id ON audio_assets(summary_id);

-- 4) USER SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
  user_id              TEXT PRIMARY KEY,
  country              VARCHAR(2) NOT NULL,
  regions              TEXT[] DEFAULT '{}',
  content_langs        TEXT[] DEFAULT '{en}',
  ui_lang              VARCHAR(8) NOT NULL DEFAULT 'en',
  categories           TEXT[] DEFAULT '{}',
  preferred_mode       TEXT NOT NULL DEFAULT 'mixed',
  default_persona      TEXT NOT NULL DEFAULT 'neutral',
  default_humor_level  INTEGER NOT NULL DEFAULT 3,
  default_speed        DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  reduce_disturbing    BOOLEAN NOT NULL DEFAULT FALSE,
  limit_night_notifs   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) USER EVENTS
CREATE TABLE IF NOT EXISTS user_events (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  type               TEXT NOT NULL,
  article_id         TEXT,
  summary_id         TEXT,
  audio_id           TEXT,
  position_seconds   INTEGER,
  meta               JSONB DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at);
