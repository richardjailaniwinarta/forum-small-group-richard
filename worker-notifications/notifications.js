// Notifikasi per batch untuk app /app/.
// Cara pasang: lihat README.md. Modul ini sengaja tidak meng-import apa pun dari Worker kamu;
// semua helper dioper lewat `deps` supaya tidak bergantung pada struktur file di proyek Worker.

const KINDS = ['Morning Message', 'Pengumuman', 'Pengingat', 'Sesi', 'Nilai', 'Small Group'];
const LIMIT = { title: 150, body: 5000, linkName: 150, linkUrl: 2000 };
const LIST_LIMIT = 50;

// users.batch tertulis 'B34' (admin '0'); notifikasi menyimpan angkanya saja ('34').
const digits = (v) => String(v ?? '').replace(/[^0-9]/g, '');

const bad = (c, msg, status = 400) => c.json({ error: msg }, status);

export function registerNotificationRoutes(app, { getDb, requireAuth, requireAdmin }) {
  // Token JWT berlaku 30 hari dan /verify tidak mengecek database. Untuk rute notifikasi, status akun
  // dicek ulang ke database di SETIAP request, jadi akun yang dihapus / tidak aktif langsung ditolak.
  async function activeUser(sql, payload) {
    const rows = await sql`SELECT student_id, nama, batch, status, role FROM users WHERE student_id = ${String(payload.studentId)}`;
    const u = rows[0];
    return u && u.status === 'Active' ? u : null;
  }

  async function requireActiveAdmin(c, sql) {
    const payload = await requireAdmin(c);
    if (!payload) return null;
    const u = await activeUser(sql, payload);
    return u && u.role === 'admin' ? u : null;
  }

  // Student: pesan untuk batch-nya sendiri. Admin boleh melihat batch lain lewat ?batch=
  app.get('/me/notifications', async (c) => {
    const payload = await requireAuth(c);
    if (!payload) return bad(c, 'Unauthorized', 401);
    const sql = getDb(c.env.DATABASE_URL);
    const user = await activeUser(sql, payload);
    if (!user) return bad(c, 'Akun tidak aktif', 403);
    const q = c.req.query('batch');
    const batch = user.role === 'admin' && q ? digits(q) : digits(user.batch);
    if (!batch || batch === '0') return c.json({ success: true, batch, items: [] });
    const items = await sql`
      SELECT id, kind, title, body, link_name, link_url, created_at
      FROM notifications WHERE batch = ${batch}
      ORDER BY created_at DESC, id DESC LIMIT ${LIST_LIMIT}`;
    return c.json({ success: true, batch, items });
  });

  // Admin: daftar batch beserta jumlah student aktif (untuk pilihan batch di form).
  app.get('/admin/notification-batches', async (c) => {
    const sql = getDb(c.env.DATABASE_URL);
    if (!(await requireActiveAdmin(c, sql))) return bad(c, 'Forbidden', 403);
    const rows = await sql`
      SELECT regexp_replace(batch, '[^0-9]', '', 'g') AS batch, count(*)::int AS students
      FROM users
      WHERE status = 'Active' AND COALESCE(role, 'student') = 'student'
      GROUP BY 1 HAVING regexp_replace(batch, '[^0-9]', '', 'g') <> '' ORDER BY 1`;
    return c.json({ success: true, kinds: KINDS, batches: rows });
  });

  // Admin: kirim pesan ke semua student aktif satu batch.
  app.post('/admin/notifications', async (c) => {
    const sql = getDb(c.env.DATABASE_URL);
    const admin = await requireActiveAdmin(c, sql);
    if (!admin) return bad(c, 'Forbidden', 403);
    let b;
    try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const batch = digits(b.batch);
    const kind = String(b.kind || '').trim();
    const title = String(b.title || '').trim();
    const body = String(b.body || '').replace(/\r\n?/g, '\n').trim();
    const linkUrl = String(b.linkUrl || '').trim();
    const linkName = String(b.linkName || '').trim() || (linkUrl ? 'Buka link' : '');

    if (!batch || batch === '0') return bad(c, 'Pilih batch tujuan');
    if (!KINDS.includes(kind)) return bad(c, 'Kategori tidak dikenal');
    if (!title) return bad(c, 'Judul wajib diisi');
    if (!body) return bad(c, 'Isi pesan wajib diisi');
    if (title.length > LIMIT.title) return bad(c, `Judul maksimal ${LIMIT.title} karakter`);
    if (body.length > LIMIT.body) return bad(c, `Isi pesan maksimal ${LIMIT.body} karakter`);
    if (linkName.length > LIMIT.linkName) return bad(c, `Nama link maksimal ${LIMIT.linkName} karakter`);
    if (linkUrl) {
      if (linkUrl.length > LIMIT.linkUrl || !/^https:\/\/[^\s]+$/i.test(linkUrl)) return bad(c, 'Link harus diawali https://');
    }

    // Cegah salah ketik batch: harus ada student aktif di batch itu.
    const cnt = await sql`
      SELECT count(*)::int AS n FROM users
      WHERE status = 'Active' AND COALESCE(role, 'student') = 'student'
        AND regexp_replace(batch, '[^0-9]', '', 'g') = ${batch}`;
    const recipients = cnt[0] ? cnt[0].n : 0;
    if (!recipients) return bad(c, `Tidak ada student aktif di Batch ${batch}`);

    const ins = await sql`
      INSERT INTO notifications (batch, kind, title, body, link_name, link_url, created_by)
      VALUES (${batch}, ${kind}, ${title}, ${body}, ${linkUrl ? linkName : null}, ${linkUrl || null}, ${admin.student_id})
      RETURNING id, created_at`;
    return c.json({ success: true, id: ins[0].id, batch, recipients, created_at: ins[0].created_at });
  });

  // Admin: riwayat pesan terkirim per batch.
  app.get('/admin/notifications', async (c) => {
    const sql = getDb(c.env.DATABASE_URL);
    if (!(await requireActiveAdmin(c, sql))) return bad(c, 'Forbidden', 403);
    const batch = digits(c.req.query('batch'));
    if (!batch) return bad(c, 'Parameter batch wajib diisi');
    const items = await sql`
      SELECT id, kind, title, body, link_name, link_url, created_by, created_at
      FROM notifications WHERE batch = ${batch}
      ORDER BY created_at DESC, id DESC LIMIT ${LIST_LIMIT}`;
    return c.json({ success: true, batch, items });
  });

  // Admin: hapus pesan (hilang dari semua student).
  app.post('/admin/notifications/delete', async (c) => {
    const sql = getDb(c.env.DATABASE_URL);
    if (!(await requireActiveAdmin(c, sql))) return bad(c, 'Forbidden', 403);
    let b;
    try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0) return bad(c, 'ID pesan tidak valid');
    const rows = await sql`DELETE FROM notifications WHERE id = ${id} RETURNING id`;
    if (!rows.length) return bad(c, 'Pesan tidak ditemukan', 404);
    return c.json({ success: true, id });
  });
}
