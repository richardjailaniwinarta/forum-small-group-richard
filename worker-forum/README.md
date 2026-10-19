# Forum SG Richard: bagian server (Worker + R2)

Forum dipakai di app HP (`/app/`, tab **Forum**) dan di website laptop (`/forum/`, tautan **Forum** di menu Dashboard & Task Tracker).
Tampilannya sudah ada di repo. Supaya berfungsi, server perlu dipasang 1x dengan langkah di bawah.

## Langkah pemasangan (urut)

### 1. Buat tabel di Neon
Neon → **SQL Editor** → tempel seluruh isi `schema.sql` → **Run**.
Aman dijalankan ulang. Tabel `users` hanya ditambah 2 kolom (`is_moderator`, `forum_muted`); data yang ada tidak berubah.

### 2. Buat tempat penyimpanan gambar (R2) di Cloudflare
Cloudflare dashboard → **R2 Object Storage** → **Create bucket** → nama: `sgr-forum` → Create.
- Jangan aktifkan akses publik. Gambar hanya bisa dibuka lewat link bertanda tangan dari server.
- Kalau Cloudflare meminta mengaktifkan R2 / menambah metode pembayaran, ikuti petunjuknya (paket gratis: 10 GB penyimpanan).

### 3. Hubungkan R2 ke Worker
Di folder proyek Worker (yang ada `wrangler.toml` atau `wrangler.jsonc`), tambahkan:

`wrangler.toml`:
```toml
[[r2_buckets]]
binding = "FORUM_BUCKET"
bucket_name = "sgr-forum"
```
atau `wrangler.jsonc`:
```jsonc
"r2_buckets": [{ "binding": "FORUM_BUCKET", "bucket_name": "sgr-forum" }]
```
Tulis di file konfigurasi ini, jangan hanya di dashboard: `wrangler deploy` berikutnya menimpa pengaturan dashboard.

### 4. Pasang kode forum
- Salin `forum.js` ke folder `src/` proyek Worker.
- Di `src/index.js`, tambahkan di bagian import:
  ```js
  import { registerForumRoutes } from "./forum.js";
  ```
  dan tepat **sebelum** baris `app.get("/", ...)`:
  ```js
  registerForumRoutes(app, { getDb, requireAuth });
  ```
  (`getDb` dan `requireAuth` sudah dipakai di `index.js` kamu.)

### 5. Deploy
`npx wrangler deploy` di folder proyek Worker.

### 6. Cek
Buka `https://sgr-backend.richweinz27.workers.dev/forum/threads` di browser → harus muncul `{"error":"Unauthorized"}`.
Itu tandanya forum aktif dan terkunci untuk yang belum login.

## Aturan yang dijaga server
| Hal | Aturan |
| --- | --- |
| Siapa boleh baca/tulis | Hanya akun **Active** di tabel `users` (dicek ke database setiap request) |
| Kategori | Pengumuman, Tanya Jawab, Diskusi, Tips, Santai. **Pengumuman** khusus admin & moderator |
| Panjang | Judul 150, isi thread 10.000, komentar 3.000 karakter |
| Gambar | JPG/PNG/WebP (dicek dari isi file), **maks 2 MB**, **maks 5 per posting**; app mengecilkan foto otomatis |
| Batas spam (student) | 5 thread/jam, 60 komentar/jam, 40 gambar/hari. Admin & moderator tidak dibatasi |
| Edit | Hanya penulisnya (teks & kategori). Ditandai "diedit" |
| Hapus | Penulis, admin, moderator. Gambar ikut terhapus dari R2 |
| Sematkan / kunci / bisukan | Admin & moderator. Admin tidak bisa dibisukan; moderator hanya bisa dibisukan admin |
| Tambah / cabut moderator | Hanya admin (app → Forum → ikon perisai, atau laptop → Kelola forum) |
| Privasi | Student ID penulis tidak dikirim ke student lain; yang tampil nama lengkap + batch |
| Catatan | Tindakan moderator dicatat di tabel `forum_mod_log` |

Gambar yang diunggah tapi tidak jadi diposting dibersihkan otomatis setelah 1 hari.

## Penyimpanan gambar (batas R2)
Server menjumlah ukuran semua gambar forum yang tersimpan (tercatat di tabel `forum_images`).
| Pemakaian | Yang terjadi |
| --- | --- |
| di bawah 80% | Normal |
| 80% ke atas | Admin melihat peringatan kuning di forum, dan **email** dikirim ke semua admin |
| 95% ke atas | **Unggah gambar diblokir untuk semua** (student melihat: "Tidak bisa upload gambar, tanyakan admin"). Menulis thread/komentar tanpa gambar tetap bisa. Email kedua dikirim ke admin |

Membersihkan: app → Forum → ikon perisai (**Kelola forum**) → *Penyimpanan gambar*: daftar thread dengan gambar terbanyak
(buka lalu hapus thread-nya), atau **Hapus gambar lama** (lebih dari 3/6/12 bulan; thread & komentar tetap ada, hanya gambarnya hilang).
Begitu pemakaian turun di bawah 95%, unggah gambar otomatis terbuka lagi.

Pengaturan (semuanya sudah ada di Worker kamu, tidak perlu ditambah):
- Email memakai `BREVO_API_KEY` dan `SENDER_EMAIL` yang sama dengan email OTP, dikirim ke kolom `email` semua akun admin aktif.
- `SGR_KV` dipakai supaya email yang sama tidak terkirim berulang (paling sering 1x per 12 jam per batas).
- Opsional: variabel Worker `FORUM_IMAGE_QUOTA_BYTES` untuk mengganti kuota (default `10000000000` = 10 GB),
  misalnya kalau nanti pindah ke paket berbayar. Hitungan ini hanya gambar forum; kalau R2 dipakai untuk hal lain, kurangi kuotanya.
