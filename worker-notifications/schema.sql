-- Jalankan SEKALI di Neon (SQL Editor). Tidak mengubah tabel yang sudah ada.
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  batch       VARCHAR(20)  NOT NULL,           -- angka saja, mis. '34' (di tabel users tertulis 'B34')
  kind        VARCHAR(30)  NOT NULL,           -- kategori: Morning Message, Pengumuman, ...
  title       VARCHAR(150) NOT NULL,
  body        TEXT         NOT NULL,
  link_name   VARCHAR(150),
  link_url    TEXT,
  created_by  VARCHAR(50)  NOT NULL,           -- student_id admin yang mengirim
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_batch_created_idx ON notifications (batch, created_at DESC);
