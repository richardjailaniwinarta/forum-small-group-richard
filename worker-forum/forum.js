// Forum SG Richard: rute Worker. Cara pasang: lihat README.md.
// Modul ini tidak meng-import apa pun dari Worker kamu; helper dioper lewat `deps`.
// Kebutuhan env: DATABASE_URL, JWT_SECRET (sudah ada), dan binding R2 `FORUM_BUCKET` (baru).

const CATEGORIES = ['Pengumuman', 'Tanya Jawab', 'Diskusi', 'Tips', 'Santai'];
const STAFF_ONLY = ['Pengumuman']; // hanya admin & moderator
const LIMIT = {
  title: 150, threadBody: 10000, comment: 3000,
  imagesPerPost: 5, imageBytes: 2 * 1024 * 1024,
  pageSize: 30, commentsPerThread: 500, search: 100
};
const RATE = { threadsPerHour: 5, commentsPerHour: 60, uploadsPerDay: 40 }; // admin & moderator tidak dibatasi
// Penyimpanan gambar (R2): peringatan untuk admin di 80%, unggahan diblokir di 95%.
// Kuota bisa diubah tanpa mengubah kode lewat variabel Worker FORUM_IMAGE_QUOTA_BYTES (default 10 GB).
const STORAGE = { warn: 0.80, block: 0.95, defaultQuota: 10 * 1000 * 1000 * 1000 };
const BLOCK_MSG = 'Tidak bisa upload gambar, tanyakan admin';
const IMG_TTL = 6 * 3600; // link gambar berlaku 6 jam (detik)
const IMG_FILE_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const digits = (v) => String(v ?? '').replace(/[^0-9]/g, '');
const bad = (c, msg, status = 400) => c.json({ error: msg }, status);
const text = (v) => (typeof v === 'string' ? v : '').replace(/\r\n?/g, '\n').trim();
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const gb = (n) => (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' GB';
const posInt = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

// Jenis file dicek dari isinya (bukan dari nama/ekstensi).
function sniff(b) {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return 'png';
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'webp';
  return null;
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('forum-img:' + secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 40);
}
const sameText = (a, b) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

function imageIdsFrom(v) {
  if (v == null) return [];
  if (!Array.isArray(v)) return null;
  const ids = [...new Set(v.map(posInt))];
  return ids.includes(null) ? null : ids;
}

// Nama penulis + batch + lencana, TANPA student_id (tidak dibocorkan ke sesama student).
function author(r, me) {
  const isAdmin = r.author_role === 'admin';
  const b = digits(r.author_batch);
  return {
    name: r.author_name || 'Akun tidak aktif',
    batch: !isAdmin && b && b !== '0' ? 'B' + b : '',
    badge: isAdmin ? 'admin' : r.author_mod ? 'moderator' : '',
    mine: r.author_id === me.id
  };
}

export function registerForumRoutes(app, { getDb, requireAuth }) {
  // Setiap request: token valid DAN akun di database masih Active.
  async function session(c) {
    const payload = await requireAuth(c);
    if (!payload) return { res: bad(c, 'Unauthorized', 401) };
    const sql = getDb(c.env.DATABASE_URL);
    const rows = await sql`SELECT student_id, status, role, is_moderator, forum_muted FROM users WHERE student_id = ${String(payload.studentId)}`;
    const u = rows[0];
    if (!u || u.status !== 'Active') return { res: bad(c, 'Akun tidak aktif', 403) };
    const isAdmin = u.role === 'admin';
    return { sql, me: { id: u.student_id, isAdmin, isMod: isAdmin || u.is_moderator === true, muted: !isAdmin && u.forum_muted === true } };
  }

  const meView = (me) => ({ isAdmin: me.isAdmin, isMod: me.isMod, muted: me.muted });

  // ---------- Pemakaian penyimpanan gambar ----------
  // Setiap gambar dicatat ukurannya di forum_images; jumlahnya = pemakaian R2 oleh forum.
  const quotaOf = (c) => { const q = Number(c.env.FORUM_IMAGE_QUOTA_BYTES); return q > 0 ? q : STORAGE.defaultQuota; };
  const levelOf = (used, quota) => (used >= quota * STORAGE.block ? 'block' : used >= quota * STORAGE.warn ? 'warn' : 'ok');
  async function usage(sql) {
    const r = await sql`SELECT COALESCE(sum(size_bytes), 0)::bigint AS used, count(*)::int AS n FROM forum_images`;
    return { used: Number(r[0].used), count: r[0].n };
  }
  async function meFull(c, sql, me) {
    const quota = quotaOf(c), { used } = await usage(sql), level = levelOf(used, quota);
    const out = { ...meView(me), uploadsBlocked: level === 'block' };
    if (me.isAdmin) out.storage = { level, percent: Math.round((used / quota) * 1000) / 10 };
    return out;
  }

  // Email ke semua admin (lewat Brevo, sama seperti email OTP) saat pemakaian melewati 80% atau 95%.
  async function alertAdmins(c, sql, before, after) {
    const quota = quotaOf(c);
    const crossed = after >= quota * STORAGE.block && before < quota * STORAGE.block ? '95%'
      : after >= quota * STORAGE.warn && before < quota * STORAGE.warn ? '80%' : null;
    if (!crossed || !c.env.BREVO_API_KEY || !c.env.SENDER_EMAIL) return;
    const send = (async () => {
      const kv = c.env.SGR_KV, key = 'forum-storage-alert:' + crossed;
      if (kv && (await kv.get(key))) return; // paling sering 1 email per 12 jam per batas
      const admins = await sql`SELECT nama, email FROM users WHERE role = 'admin' AND status = 'Active' AND email IS NOT NULL AND email <> ''`;
      if (!admins.length) return;
      const pct = Math.round((after / quota) * 1000) / 10;
      const blocked = crossed === '95%';
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': c.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Small Group Richard', email: c.env.SENDER_EMAIL },
          to: admins.map((a) => ({ email: a.email, name: a.nama || undefined })),
          subject: `Penyimpanan gambar forum sudah ${crossed}` + (blocked ? ': unggah gambar diblokir' : ''),
          htmlContent: `<p>Halo,</p>
            <p>Penyimpanan gambar forum Small Group Richard sudah terpakai <b>${esc(gb(after))} dari ${esc(gb(quota))} (${pct}%)</b>.</p>
            <p>${blocked
              ? 'Student sekarang <b>tidak bisa mengunggah gambar</b> (pesan: &quot;' + esc(BLOCK_MSG) + '&quot;). Menulis thread dan komentar tetap bisa.'
              : 'Unggah gambar akan otomatis diblokir saat mencapai 95%.'}</p>
            <p>Hapus sebagian gambar lewat app: Forum &rarr; ikon perisai (Kelola forum) &rarr; Penyimpanan gambar.</p>`
        })
      });
      if (kv) await kv.put(key, '1', { expirationTtl: 12 * 3600 });
    })().catch(() => { /* email gagal tidak menggagalkan unggahan */ });
    try { c.executionCtx.waitUntil(send); } catch { await send; }
  }
  const log = (sql, actor, action, target, detail = null) =>
    sql`INSERT INTO forum_mod_log (actor_id, action, target, detail) VALUES (${actor}, ${action}, ${target}, ${detail})`;

  async function signedUrl(c, file) {
    const exp = Math.ceil(Date.now() / 1000 / 3600) * 3600 + IMG_TTL; // stabil per jam -> bisa di-cache
    const s = await hmac(c.env.JWT_SECRET, file + ':' + exp);
    return new URL(c.req.url).origin + '/forum/img/' + file + '?e=' + exp + '&s=' + s;
  }

  async function removeFiles(c, files) {
    if (!files.length || !c.env.FORUM_BUCKET) return;
    for (let i = 0; i < files.length; i += 1000) { // R2 menghapus maks 1000 file per panggilan
      try { await c.env.FORUM_BUCKET.delete(files.slice(i, i + 1000).map((f) => 'forum/' + f)); } catch { /* sisa file tidak menghalangi */ }
    }
  }

  // Gambar yang akan ditempel harus milik sendiri dan belum menempel di mana pun.
  async function checkImages(sql, me, ids) {
    if (!ids.length) return true;
    const r = await sql`SELECT count(*)::int AS n FROM forum_images
      WHERE id = ANY(${ids}::int[]) AND owner_id = ${me.id} AND thread_id IS NULL AND comment_id IS NULL`;
    return r[0].n === ids.length;
  }

  // ---------- Daftar thread ----------
  app.get('/forum/threads', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const cat = CATEGORIES.includes(c.req.query('category')) ? c.req.query('category') : null;
    const q = text(c.req.query('q')).slice(0, LIMIT.search) || null;
    const page = Math.min(posInt(c.req.query('page')) || 1, 1000);
    const rows = await sql`
      SELECT t.id, t.category, t.title, t.pinned, t.locked, t.created_at, t.edited_at, t.last_activity_at, t.author_id,
             u.nama AS author_name, u.batch AS author_batch, u.role AS author_role, u.is_moderator AS author_mod,
             (SELECT count(*)::int FROM forum_comments fc WHERE fc.thread_id = t.id) AS comment_count,
             (SELECT count(*)::int FROM forum_images fi WHERE fi.thread_id = t.id) AS image_count
      FROM forum_threads t LEFT JOIN users u ON u.student_id = t.author_id
      WHERE (${cat}::text IS NULL OR t.category = ${cat})
        AND (${q}::text IS NULL OR position(lower(${q}::text) in lower(t.title || ' ' || t.body)) > 0)
      ORDER BY t.pinned DESC, t.last_activity_at DESC, t.id DESC
      LIMIT ${LIMIT.pageSize + 1} OFFSET ${(page - 1) * LIMIT.pageSize}`;
    const items = rows.slice(0, LIMIT.pageSize).map((r) => ({
      id: r.id, category: r.category, title: r.title, pinned: r.pinned, locked: r.locked,
      createdAt: r.created_at, editedAt: r.edited_at, lastActivityAt: r.last_activity_at,
      commentCount: r.comment_count, imageCount: r.image_count, author: author(r, me)
    }));
    return c.json({ success: true, items, page, hasMore: rows.length > LIMIT.pageSize, categories: CATEGORIES, me: await meFull(c, sql, me) });
  });

  // ---------- Satu thread + komentar ----------
  app.get('/forum/threads/:id', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const id = posInt(c.req.param('id'));
    if (!id) return bad(c, 'Thread tidak ditemukan', 404);
    const tr = await sql`
      SELECT t.*, u.nama AS author_name, u.batch AS author_batch, u.role AS author_role, u.is_moderator AS author_mod
      FROM forum_threads t LEFT JOIN users u ON u.student_id = t.author_id WHERE t.id = ${id}`;
    const t = tr[0];
    if (!t) return bad(c, 'Thread tidak ditemukan', 404);
    const cr = await sql`
      SELECT fc.id, fc.body, fc.created_at, fc.edited_at, fc.author_id,
             u.nama AS author_name, u.batch AS author_batch, u.role AS author_role, u.is_moderator AS author_mod
      FROM forum_comments fc LEFT JOIN users u ON u.student_id = fc.author_id
      WHERE fc.thread_id = ${id} ORDER BY fc.created_at, fc.id LIMIT ${LIMIT.commentsPerThread}`;
    const ir = await sql`
      SELECT id, file, thread_id, comment_id FROM forum_images
      WHERE thread_id = ${id} OR comment_id IN (SELECT id FROM forum_comments WHERE thread_id = ${id}) ORDER BY id`;
    const imgs = await Promise.all(ir.map(async (r) => ({ ...r, url: await signedUrl(c, r.file) })));
    const pick = (fn) => imgs.filter(fn).map((r) => ({ id: r.id, url: r.url }));
    const a = author(t, me);
    return c.json({
      success: true, me: await meFull(c, sql, me),
      thread: {
        id: t.id, category: t.category, title: t.title, body: t.body, pinned: t.pinned, locked: t.locked,
        createdAt: t.created_at, editedAt: t.edited_at, author: a,
        images: pick((r) => r.thread_id === t.id),
        canEdit: a.mine, canDelete: a.mine || me.isMod
      },
      comments: cr.map((r) => {
        const ca = author(r, me);
        return {
          id: r.id, body: r.body, createdAt: r.created_at, editedAt: r.edited_at, author: ca,
          images: pick((x) => x.comment_id === r.id), canEdit: ca.mine, canDelete: ca.mine || me.isMod
        };
      })
    });
  });

  // ---------- Buat thread ----------
  app.post('/forum/threads', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (me.muted) return bad(c, 'Kamu sedang dibisukan oleh moderator', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const category = typeof b.category === 'string' ? b.category : '';
    const title = text(b.title), body = text(b.body), ids = imageIdsFrom(b.imageIds);
    if (!CATEGORIES.includes(category)) return bad(c, 'Kategori tidak dikenal');
    if (STAFF_ONLY.includes(category) && !me.isMod) return bad(c, 'Kategori Pengumuman khusus admin dan moderator', 403);
    if (!title) return bad(c, 'Judul wajib diisi');
    if (!body) return bad(c, 'Isi thread wajib diisi');
    if (title.length > LIMIT.title) return bad(c, `Judul maksimal ${LIMIT.title} karakter`);
    if (body.length > LIMIT.threadBody) return bad(c, `Isi maksimal ${LIMIT.threadBody} karakter`);
    if (!ids) return bad(c, 'Daftar gambar tidak valid');
    if (ids.length > LIMIT.imagesPerPost) return bad(c, `Maksimal ${LIMIT.imagesPerPost} gambar`);
    if (!me.isMod) {
      const r = await sql`SELECT count(*)::int AS n FROM forum_threads WHERE author_id = ${me.id} AND created_at > now() - interval '1 hour'`;
      if (r[0].n >= RATE.threadsPerHour) return bad(c, 'Terlalu banyak thread baru. Coba lagi nanti.', 429);
    }
    if (!(await checkImages(sql, me, ids))) return bad(c, 'Ada gambar yang tidak valid. Unggah ulang gambarnya.');
    const pinned = me.isMod && b.pinned === true, locked = me.isMod && b.locked === true;
    const ins = await sql`INSERT INTO forum_threads (category, title, body, author_id, pinned, locked)
      VALUES (${category}, ${title}, ${body}, ${me.id}, ${pinned}, ${locked}) RETURNING id`;
    const id = ins[0].id;
    if (ids.length) await sql`UPDATE forum_images SET thread_id = ${id}
      WHERE id = ANY(${ids}::int[]) AND owner_id = ${me.id} AND thread_id IS NULL AND comment_id IS NULL`;
    return c.json({ success: true, id });
  });

  async function loadThread(sql, id) {
    const r = await sql`SELECT id, author_id, locked, category FROM forum_threads WHERE id = ${id}`;
    return r[0] || null;
  }

  // ---------- Edit thread (hanya penulis) ----------
  app.post('/forum/threads/:id/edit', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const id = posInt(c.req.param('id'));
    const t = id && (await loadThread(sql, id));
    if (!t) return bad(c, 'Thread tidak ditemukan', 404);
    if (t.author_id !== me.id) return bad(c, 'Hanya penulis yang bisa mengedit', 403);
    if (me.muted) return bad(c, 'Kamu sedang dibisukan oleh moderator', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const category = typeof b.category === 'string' ? b.category : t.category;
    const title = text(b.title), body = text(b.body);
    if (!CATEGORIES.includes(category)) return bad(c, 'Kategori tidak dikenal');
    if (STAFF_ONLY.includes(category) && category !== t.category && !me.isMod) return bad(c, 'Kategori Pengumuman khusus admin dan moderator', 403);
    if (!title || !body) return bad(c, 'Judul dan isi wajib diisi');
    if (title.length > LIMIT.title) return bad(c, `Judul maksimal ${LIMIT.title} karakter`);
    if (body.length > LIMIT.threadBody) return bad(c, `Isi maksimal ${LIMIT.threadBody} karakter`);
    await sql`UPDATE forum_threads SET category = ${category}, title = ${title}, body = ${body}, edited_at = now() WHERE id = ${id}`;
    return c.json({ success: true, id });
  });

  // ---------- Hapus thread (penulis, admin, moderator) ----------
  app.post('/forum/threads/:id/delete', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const id = posInt(c.req.param('id'));
    const t = id && (await loadThread(sql, id));
    if (!t) return bad(c, 'Thread tidak ditemukan', 404);
    const own = t.author_id === me.id;
    if (!own && !me.isMod) return bad(c, 'Tidak diizinkan', 403);
    const files = await sql`SELECT file FROM forum_images
      WHERE thread_id = ${id} OR comment_id IN (SELECT id FROM forum_comments WHERE thread_id = ${id})`;
    await sql`DELETE FROM forum_threads WHERE id = ${id}`;
    await removeFiles(c, files.map((r) => r.file));
    if (!own) await log(sql, me.id, 'delete_thread', 'thread:' + id, t.author_id);
    return c.json({ success: true, id });
  });

  // ---------- Sematkan / kunci (admin, moderator) ----------
  app.post('/forum/threads/:id/moderate', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isMod) return bad(c, 'Tidak diizinkan', 403);
    const id = posInt(c.req.param('id'));
    const t = id && (await loadThread(sql, id));
    if (!t) return bad(c, 'Thread tidak ditemukan', 404);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    if (typeof b.pinned === 'boolean') {
      await sql`UPDATE forum_threads SET pinned = ${b.pinned} WHERE id = ${id}`;
      await log(sql, me.id, b.pinned ? 'pin' : 'unpin', 'thread:' + id);
    }
    if (typeof b.locked === 'boolean') {
      await sql`UPDATE forum_threads SET locked = ${b.locked} WHERE id = ${id}`;
      await log(sql, me.id, b.locked ? 'lock' : 'unlock', 'thread:' + id);
    }
    return c.json({ success: true, id });
  });

  // ---------- Komentar ----------
  app.post('/forum/threads/:id/comments', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const id = posInt(c.req.param('id'));
    const t = id && (await loadThread(sql, id));
    if (!t) return bad(c, 'Thread tidak ditemukan', 404);
    if (me.muted) return bad(c, 'Kamu sedang dibisukan oleh moderator', 403);
    if (t.locked && !me.isMod) return bad(c, 'Thread ini dikunci. Komentar baru tidak bisa ditambahkan.', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const body = text(b.body), ids = imageIdsFrom(b.imageIds);
    if (!ids) return bad(c, 'Daftar gambar tidak valid');
    if (!body && !ids.length) return bad(c, 'Komentar tidak boleh kosong');
    if (body.length > LIMIT.comment) return bad(c, `Komentar maksimal ${LIMIT.comment} karakter`);
    if (ids.length > LIMIT.imagesPerPost) return bad(c, `Maksimal ${LIMIT.imagesPerPost} gambar`);
    if (!me.isMod) {
      const r = await sql`SELECT count(*)::int AS n FROM forum_comments WHERE author_id = ${me.id} AND created_at > now() - interval '1 hour'`;
      if (r[0].n >= RATE.commentsPerHour) return bad(c, 'Terlalu banyak komentar. Coba lagi nanti.', 429);
    }
    if (!(await checkImages(sql, me, ids))) return bad(c, 'Ada gambar yang tidak valid. Unggah ulang gambarnya.');
    const ins = await sql`INSERT INTO forum_comments (thread_id, author_id, body) VALUES (${id}, ${me.id}, ${body}) RETURNING id`;
    const cid = ins[0].id;
    if (ids.length) await sql`UPDATE forum_images SET comment_id = ${cid}
      WHERE id = ANY(${ids}::int[]) AND owner_id = ${me.id} AND thread_id IS NULL AND comment_id IS NULL`;
    await sql`UPDATE forum_threads SET last_activity_at = now() WHERE id = ${id}`;
    return c.json({ success: true, id: cid });
  });

  async function loadComment(sql, id) {
    const r = await sql`SELECT fc.id, fc.author_id, fc.thread_id,
      (SELECT count(*)::int FROM forum_images fi WHERE fi.comment_id = fc.id) AS image_count
      FROM forum_comments fc WHERE fc.id = ${id}`;
    return r[0] || null;
  }

  app.post('/forum/comments/:id/edit', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const id = posInt(c.req.param('id'));
    const cm = id && (await loadComment(sql, id));
    if (!cm) return bad(c, 'Komentar tidak ditemukan', 404);
    if (cm.author_id !== me.id) return bad(c, 'Hanya penulis yang bisa mengedit', 403);
    if (me.muted) return bad(c, 'Kamu sedang dibisukan oleh moderator', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const body = text(b.body);
    if (!body && !cm.image_count) return bad(c, 'Komentar tidak boleh kosong');
    if (body.length > LIMIT.comment) return bad(c, `Komentar maksimal ${LIMIT.comment} karakter`);
    await sql`UPDATE forum_comments SET body = ${body}, edited_at = now() WHERE id = ${id}`;
    return c.json({ success: true, id });
  });

  app.post('/forum/comments/:id/delete', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    const id = posInt(c.req.param('id'));
    const cm = id && (await loadComment(sql, id));
    if (!cm) return bad(c, 'Komentar tidak ditemukan', 404);
    const own = cm.author_id === me.id;
    if (!own && !me.isMod) return bad(c, 'Tidak diizinkan', 403);
    const files = await sql`SELECT file FROM forum_images WHERE comment_id = ${id}`;
    await sql`DELETE FROM forum_comments WHERE id = ${id}`;
    await removeFiles(c, files.map((r) => r.file));
    if (!own) await log(sql, me.id, 'delete_comment', 'comment:' + id, cm.author_id);
    return c.json({ success: true, id });
  });

  // ---------- Unggah gambar (maks 2 MB, JPG/PNG/WebP) ----------
  app.post('/forum/images', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (me.muted) return bad(c, 'Kamu sedang dibisukan oleh moderator', 403);
    const bucket = c.env.FORUM_BUCKET;
    if (!bucket) return bad(c, 'Penyimpanan gambar belum diatur di server', 503);
    const declared = Number(c.req.header('content-length') || 0);
    if (declared > LIMIT.imageBytes) return bad(c, 'Ukuran gambar maksimal 2 MB', 413);
    const buf = new Uint8Array(await c.req.arrayBuffer());
    if (!buf.length) return bad(c, 'File kosong');
    if (buf.length > LIMIT.imageBytes) return bad(c, 'Ukuran gambar maksimal 2 MB', 413);
    const ext = sniff(buf);
    if (!ext) return bad(c, 'Hanya gambar JPG, PNG, atau WebP', 415);
    if (!me.isMod) {
      const r = await sql`SELECT count(*)::int AS n FROM forum_images WHERE owner_id = ${me.id} AND created_at > now() - interval '1 day'`;
      if (r[0].n >= RATE.uploadsPerDay) return bad(c, 'Batas unggah gambar hari ini sudah tercapai', 429);
    }
    // Bersihkan gambar milik sendiri yang diunggah lebih dari sehari lalu tapi tidak pernah diposting.
    const stale = await sql`DELETE FROM forum_images WHERE owner_id = ${me.id} AND thread_id IS NULL AND comment_id IS NULL
      AND created_at < now() - interval '1 day' RETURNING file`;
    await removeFiles(c, stale.map((r) => r.file));
    // Penyimpanan sudah 95%: tolak (berlaku untuk semua, termasuk admin).
    const quota = quotaOf(c), { used } = await usage(sql);
    if (used >= quota * STORAGE.block) {
      return bad(c, me.isAdmin ? 'Penyimpanan gambar forum sudah 95%. Hapus sebagian gambar dulu di Kelola forum.' : BLOCK_MSG, 507);
    }
    const file = crypto.randomUUID() + '.' + ext;
    await bucket.put('forum/' + file, buf, { httpMetadata: { contentType: MIME[ext] } });
    const ins = await sql`INSERT INTO forum_images (file, owner_id, size_bytes) VALUES (${file}, ${me.id}, ${buf.length}) RETURNING id`;
    await alertAdmins(c, sql, used, used + buf.length);
    return c.json({ success: true, id: ins[0].id, url: await signedUrl(c, file) });
  });

  // Tampilkan gambar. Tanpa header login (dipakai <img>), jadi dilindungi link bertanda tangan yang kedaluwarsa.
  app.get('/forum/img/:file', async (c) => {
    const file = c.req.param('file');
    const e = Number(c.req.query('e')), sig = String(c.req.query('s') || '');
    if (!IMG_FILE_RE.test(file || '') || !Number.isInteger(e) || e < Date.now() / 1000) return c.text('Not found', 404);
    if (!sameText(sig, await hmac(c.env.JWT_SECRET, file + ':' + e))) return c.text('Not found', 404);
    const obj = c.env.FORUM_BUCKET ? await c.env.FORUM_BUCKET.get('forum/' + file) : null;
    if (!obj) return c.text('Not found', 404);
    return new Response(obj.body, { headers: {
      'Content-Type': MIME[file.split('.').pop()],
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'"
    } });
  });

  // ---------- Bisukan / aktifkan pengguna (admin, moderator) ----------
  app.post('/forum/mute', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isMod) return bad(c, 'Tidak diizinkan', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    if (typeof b.muted !== 'boolean') return bad(c, 'Data tidak valid');
    let target = null;
    if (posInt(b.threadId)) target = (await sql`SELECT author_id FROM forum_threads WHERE id = ${posInt(b.threadId)}`)[0]?.author_id;
    else if (posInt(b.commentId)) target = (await sql`SELECT author_id FROM forum_comments WHERE id = ${posInt(b.commentId)}`)[0]?.author_id;
    else if (me.isAdmin && typeof b.studentId === 'string') target = b.studentId.trim();
    if (!target) return bad(c, 'Pengguna tidak ditemukan', 404);
    const u = (await sql`SELECT student_id, role, is_moderator FROM users WHERE student_id = ${target}`)[0];
    if (!u) return bad(c, 'Pengguna tidak ditemukan', 404);
    if (u.role === 'admin' || u.student_id === me.id) return bad(c, 'Pengguna ini tidak bisa dibisukan', 403);
    if (u.is_moderator && !me.isAdmin) return bad(c, 'Hanya admin yang bisa membisukan moderator', 403);
    await sql`UPDATE users SET forum_muted = ${b.muted} WHERE student_id = ${u.student_id}`;
    await log(sql, me.id, b.muted ? 'mute' : 'unmute', 'user:' + u.student_id);
    return c.json({ success: true, muted: b.muted });
  });

  // ---------- Penyimpanan gambar (hanya admin) ----------
  app.get('/forum/storage', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isAdmin) return bad(c, 'Forbidden', 403);
    const quota = quotaOf(c), { used, count } = await usage(sql);
    // Thread dengan gambar terbesar (gambar di thread + di komentarnya).
    const top = await sql`
      SELECT t.id, t.title, t.category, t.last_activity_at, u.nama AS author_name,
             count(i.id)::int AS images, COALESCE(sum(i.size_bytes), 0)::bigint AS bytes
      FROM forum_images i
      JOIN forum_threads t ON t.id = COALESCE(i.thread_id, (SELECT fc.thread_id FROM forum_comments fc WHERE fc.id = i.comment_id))
      LEFT JOIN users u ON u.student_id = t.author_id
      GROUP BY t.id, t.title, t.category, t.last_activity_at, u.nama
      ORDER BY bytes DESC LIMIT 10`;
    const pending = await sql`SELECT count(*)::int AS n, COALESCE(sum(size_bytes), 0)::bigint AS bytes FROM forum_images WHERE thread_id IS NULL AND comment_id IS NULL`;
    return c.json({
      success: true, usedBytes: used, quotaBytes: quota, imageCount: count,
      percent: Math.round((used / quota) * 1000) / 10, level: levelOf(used, quota),
      warnAt: STORAGE.warn * 100, blockAt: STORAGE.block * 100,
      unpostedImages: pending[0].n, unpostedBytes: Number(pending[0].bytes),
      topThreads: top.map((r) => ({ id: r.id, title: r.title, category: r.category, author: r.author_name || 'Akun tidak aktif',
        images: r.images, bytes: Number(r.bytes), lastActivityAt: r.last_activity_at }))
    });
  });

  // Hapus gambar yang lebih tua dari N bulan. Thread & komentarnya tetap ada, hanya gambarnya yang hilang.
  // dryRun: true = hanya menghitung (untuk ditampilkan sebelum admin menekan Hapus).
  app.post('/forum/storage/cleanup', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isAdmin) return bad(c, 'Forbidden', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const months = posInt(b.months);
    if (!months || months > 36) return bad(c, 'Pilih umur gambar 1 sampai 36 bulan');
    if (b.dryRun === true) {
      const r = await sql`SELECT count(*)::int AS n, COALESCE(sum(size_bytes), 0)::bigint AS bytes FROM forum_images
        WHERE created_at < now() - make_interval(months => ${months}::int)`;
      return c.json({ success: true, dryRun: true, count: r[0].n, bytes: Number(r[0].bytes) });
    }
    const rows = await sql`DELETE FROM forum_images WHERE created_at < now() - make_interval(months => ${months}::int) RETURNING file, size_bytes`;
    await removeFiles(c, rows.map((r) => r.file));
    const bytes = rows.reduce((a, r) => a + Number(r.size_bytes), 0);
    if (rows.length) await log(sql, me.id, 'cleanup_images', 'images', `${rows.length} gambar > ${months} bulan, ${bytes} byte`);
    return c.json({ success: true, count: rows.length, bytes });
  });

  // ---------- Kelola moderator (hanya admin) ----------
  app.get('/forum/moderators', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isAdmin) return bad(c, 'Forbidden', 403);
    const admins = await sql`SELECT student_id, nama FROM users WHERE role = 'admin' AND status = 'Active' ORDER BY nama`;
    const mods = await sql`SELECT student_id, nama, batch FROM users WHERE is_moderator = TRUE AND status = 'Active' AND COALESCE(role, 'student') <> 'admin' ORDER BY nama`;
    const muted = await sql`SELECT student_id, nama, batch FROM users WHERE forum_muted = TRUE ORDER BY nama`;
    const view = (r) => ({ studentId: r.student_id, name: r.nama, batch: digits(r.batch) && digits(r.batch) !== '0' ? 'B' + digits(r.batch) : '' });
    return c.json({ success: true, admins: admins.map(view), moderators: mods.map(view), muted: muted.map(view) });
  });

  app.get('/forum/moderator-candidates', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isAdmin) return bad(c, 'Forbidden', 403);
    const q = text(c.req.query('q')).slice(0, 60);
    if (q.length < 2) return c.json({ success: true, items: [] });
    const rows = await sql`SELECT student_id, nama, batch FROM users
      WHERE status = 'Active' AND COALESCE(role, 'student') <> 'admin' AND is_moderator = FALSE
        AND (student_id = ${q} OR position(lower(${q}::text) in lower(nama)) > 0)
      ORDER BY nama LIMIT 20`;
    return c.json({ success: true, items: rows.map((r) => ({ studentId: r.student_id, name: r.nama, batch: digits(r.batch) ? 'B' + digits(r.batch) : '' })) });
  });

  app.post('/forum/moderators', async (c) => {
    const s = await session(c); if (s.res) return s.res;
    const { sql, me } = s;
    if (!me.isAdmin) return bad(c, 'Forbidden', 403);
    let b; try { b = await c.req.json(); } catch { return bad(c, 'Data tidak valid'); }
    const id = typeof b.studentId === 'string' ? b.studentId.trim() : '';
    if (!id || (b.action !== 'add' && b.action !== 'remove')) return bad(c, 'Data tidak valid');
    const u = (await sql`SELECT student_id, status, role FROM users WHERE student_id = ${id}`)[0];
    if (!u) return bad(c, 'Student tidak ditemukan', 404);
    if (u.role === 'admin') return bad(c, 'Admin tidak perlu dijadikan moderator', 400);
    if (b.action === 'add' && u.status !== 'Active') return bad(c, 'Akun student ini tidak aktif', 400);
    await sql`UPDATE users SET is_moderator = ${b.action === 'add'} WHERE student_id = ${id}`;
    await log(sql, me.id, b.action === 'add' ? 'add_moderator' : 'remove_moderator', 'user:' + id);
    return c.json({ success: true });
  });
}
