-- Forum SG Richard. Jalankan SEKALI di Neon (SQL Editor). Aman dijalankan ulang.
-- Tabel `users` hanya DITAMBAH 2 kolom; isi yang sudah ada tidak berubah.

-- Penanda moderator forum (bisa ditambah/dicabut admin dari app) dan status "dibisukan".
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS forum_muted  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS forum_threads (
  id               SERIAL PRIMARY KEY,
  category         VARCHAR(30)  NOT NULL,
  title            VARCHAR(150) NOT NULL,
  body             TEXT         NOT NULL,
  author_id        VARCHAR(50)  NOT NULL,          -- users.student_id
  pinned           BOOLEAN      NOT NULL DEFAULT FALSE,
  locked           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  edited_at        TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forum_threads_order_idx ON forum_threads (pinned DESC, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS forum_comments (
  id         SERIAL PRIMARY KEY,
  thread_id  INTEGER     NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id  VARCHAR(50) NOT NULL,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS forum_comments_thread_idx ON forum_comments (thread_id, created_at);

-- Gambar di R2. Diunggah dulu (belum menempel), lalu ditempelkan ke thread/komentar saat diposting.
CREATE TABLE IF NOT EXISTS forum_images (
  id         SERIAL PRIMARY KEY,
  file       VARCHAR(80) NOT NULL UNIQUE,          -- nama berkas di R2 (tanpa folder), mis. '<uuid>.jpg'
  owner_id   VARCHAR(50) NOT NULL,
  thread_id  INTEGER REFERENCES forum_threads(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE,
  size_bytes INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forum_images_owner_idx ON forum_images (owner_id, created_at);
CREATE INDEX IF NOT EXISTS forum_images_thread_idx ON forum_images (thread_id);
CREATE INDEX IF NOT EXISTS forum_images_comment_idx ON forum_images (comment_id);

-- Catatan tindakan moderator (hapus, sematkan, kunci, bisukan, tambah/cabut moderator).
CREATE TABLE IF NOT EXISTS forum_mod_log (
  id          SERIAL PRIMARY KEY,
  actor_id    VARCHAR(50) NOT NULL,
  action      VARCHAR(40) NOT NULL,
  target      VARCHAR(80) NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
