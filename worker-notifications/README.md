# Notifikasi per batch — bagian Worker

Tambahan untuk Worker `sgr-backend`. Tidak mengubah kode yang sudah ada selain 2 baris di `src/index.js`.

## Isi folder
| File | Fungsi |
| --- | --- |
| `schema.sql` | Membuat tabel `notifications` di Neon (aman, tidak menyentuh tabel lain) |
| `notifications.js` | 5 rute baru (lihat bawah) |

## Cara memasang (urut)

**1. Buat tabel di Neon.** Buka Neon → SQL Editor → tempel isi `schema.sql` → Run.

**2. Salin kode ke proyek Worker kamu.** Ini proyek di laptop kamu yang berisi `wrangler.toml` (atau `wrangler.jsonc`)
dan folder `src/` dengan file `index.js`, `middleware.js`, `admin.js`, dan seterusnya. (File `index.js` besar yang kamu
unggah ke Claude adalah hasil kompilasi, bukan sumbernya, jadi jangan diedit.)
- Salin `notifications.js` ke folder `src/` proyek itu.
- Di `src/index.js`, tambahkan di bagian paling atas bersama import lainnya:
  ```js
  import { registerNotificationRoutes } from "./notifications.js";
  ```
  dan tepat **sebelum** baris `app.get("/", ...)` (atau sebelum `export default`):
  ```js
  registerNotificationRoutes(app, { getDb, requireAuth, requireAdmin });
  ```
  (`getDb`, `requireAuth`, `requireAdmin` sudah ada di proyekmu; kalau nama import-nya berbeda, sesuaikan.)

**3. Deploy:** `npx wrangler deploy` di folder proyek Worker.

**4. Cek:** buka `https://sgr-backend.richweinz27.workers.dev/me/notifications` di browser. Jawabannya harus
`{"error":"Unauthorized"}`. Itu tandanya rute baru sudah aktif dan terkunci.

## Rute baru
| Rute | Siapa | Fungsi |
| --- | --- | --- |
| `GET /me/notifications` | student login | Pesan untuk batch-nya sendiri (50 terbaru) |
| `GET /admin/notification-batches` | admin | Daftar batch + jumlah student aktif, dan daftar kategori |
| `POST /admin/notifications` | admin | Kirim pesan ke semua student aktif satu batch |
| `GET /admin/notifications?batch=34` | admin | Riwayat pesan terkirim |
| `POST /admin/notifications/delete` | admin | Hapus pesan |

## Keamanan
- Semua rute admin dicek **di server**: token harus admin **dan** akunnya di database harus masih `Active` dan `role = 'admin'`.
- Rute notifikasi mengecek status akun ke database di **setiap** request. Student yang dihapus atau tidak aktif langsung ditolak
  walau tokennya masih berlaku.
- Student hanya bisa membaca batch miliknya (batch diambil dari database, bukan dari parameter).
- Link hanya boleh `https://`. Semua query memakai parameter (tidak rawan SQL injection).

## Catatan penting
- **Batch** di tabel `users` tertulis `B34`; notifikasi menyimpan angkanya saja (`34`). Pencocokan dilakukan otomatis.
- **CORS** di Worker kamu hanya mengizinkan `https://smallgrouprichard.my.id`. Itu sudah cukup untuk `/app/`.
  Untuk uji coba dari `localhost`, tambahkan origin-nya sementara.
