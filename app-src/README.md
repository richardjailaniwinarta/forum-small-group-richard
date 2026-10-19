# SG Richard Dashboard — app mobile (PWA)

Implementasi `project/Dashboard Page.dc.html` (dan `Login Page.dc.html` untuk masuk) sebagai app React + Vite yang bisa di-install di HP.
Data diambil dari Worker yang sama dengan website `Small-Group-Richard`.

```bash
cd app-src
npm install
npm run dev        # http://localhost:5173
npm run build:site # build ke ../app/ (dilayani di https://smallgrouprichard.my.id/app/)
```

**Struktur:** `app-src/` = kode sumber, `app/` = hasil build app HP, `forum/` = hasil build halaman forum laptop.
`npm run build:site` membangun keduanya. Forum laptop: sumber di `forum-site/` + `src/forum-desktop.jsx`, memakai login website (`shared/auth.js`).
Setiap mengubah kode di `app-src/`, jalankan `npm run build:site` lalu commit folder `app/` yang baru.

Konfigurasi lewat `.env` (lihat `.env.example`):

| Variabel | Fungsi |
| --- | --- |
| `VITE_API_URL` | URL Worker. Default `https://sgr-backend.richweinz27.workers.dev`. |
| `VITE_SITE_URL` | URL website, untuk link "Lupa password?" dan "Daftar di sini". |

## Sumber data

| Layar | Endpoint |
| --- | --- |
| Login | `POST /login`, lalu `GET /verify?token=` saat app dibuka |
| Hari Ini (ID, batch, Selanjutnya, Tugas Sudah/Belum, Statistics, Bonus) | `GET /me/dashboard`, `GET /bonus-info` |
| Jadwal | `schedule` dari `GET /me/dashboard` (Calendar yang sama dengan Dashboard website) |
| Directory | `GET /directory` |
| Task Tracker | `GET /me/task-tracker` |
| Notifikasi (student) | `GET /me/notifications` (rute baru, lihat `../worker-notifications/`) |
| Forum (HP & laptop) | Rute `/forum/...` (lihat `../worker-forum/`) |
| Kirim Pesan / Terkirim (admin) | `GET /admin/notification-batches`, `POST /admin/notifications`, `GET /admin/notifications`, `POST /admin/notifications/delete` |

## Perlu diperhatikan

- **CORS:** Worker harus mengizinkan origin tempat app ini di-host (dan `http://localhost:5173` saat development).
  Kalau Worker hanya mengizinkan domain website, login dan semua data akan gagal dimuat.
- Token disimpan di `sessionStorage`: setiap browser/app ditutup, student harus login lagi (disengaja, demi keamanan).
- Akun admin melihat 2 menu khusus di app: **Kirim Pesan** (kirim ke satu batch) dan **Terkirim** (riwayat + hapus). Fitur admin lain (cari student, release bonus) tetap di website. Layar admin sengaja hanya ada di `/app/`; yang melindungi tetap pengecekan admin di Worker.
- Di HP app tampil layar penuh. Di layar lebar app tampil dalam bingkai HP 390×844 seperti desain.
