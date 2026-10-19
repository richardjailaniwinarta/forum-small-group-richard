// shared/demo-api.js
// MODE UJI COBA: tanpa login, tanpa server.
// Semua request ke Worker (sgr-backend) dijawab di browser memakai data contoh yang disimpan di
// localStorage. Server asli & data student TIDAK disentuh sama sekali.
//
// Dipasang lewat <script src="../shared/demo-api.js"></script> SEBELUM script lain di setiap halaman.
// Untuk kembali ke login & server asli: ubah DEMO_MODE jadi false (atau hapus tag script-nya).
(function () {
  var DEMO_MODE = true;
  if (!DEMO_MODE) return;

  var API_URL = "https://sgr-backend.richweinz27.workers.dev";
  var DB_KEY = "sgr_demo_db_v1";
  var ROLE_KEY = "sgr_demo_role"; // 'admin' | 'student'
  var DEMO_TOKEN = "demo-token";

  // ---------- Halaman login / daftar / lupa password: langsung ke Forum ----------
  if (/\/(login|register|forgot-password)\/?(index\.html)?$/.test(location.pathname)) {
    location.replace("../forum/");
    return;
  }

  // ---------- Token palsu supaya alur halaman tetap jalan tanpa login ----------
  try {
    sessionStorage.setItem("token", DEMO_TOKEN); // website (shared/auth.js) & forum laptop
    sessionStorage.setItem("sgr_app_token", DEMO_TOKEN); // app HP
    sessionStorage.removeItem("sgr_session_cache"); // jangan pakai peran lama dari cache auth.js
    sessionStorage.removeItem("sgr_app_session");
  } catch (e) { /* storage diblok: tetap jalan, hanya tidak tersimpan */ }

  function getRole() {
    try { return localStorage.getItem(ROLE_KEY) === "student" ? "student" : "admin"; } catch (e) { return "admin"; }
  }

  // ---------- Data contoh ----------
  var CATEGORIES = ["Pengumuman", "Tanya Jawab", "Diskusi", "Tips", "Santai"];
  var KINDS = ["Morning Message", "Pengumuman", "Pengingat", "Sesi", "Nilai", "Small Group"];
  var QUOTA = 10 * 1000 * 1000 * 1000;

  function ago(mins) { return new Date(Date.now() - mins * 60000).toISOString(); }

  function seed() {
    var users = [
      { id: "DEMO-ADMIN", nama: "Demo Admin", batch: "0", role: "admin", isMod: false, muted: false },
      { id: "DEMO-001", nama: "Demo Student", batch: "B35", role: "student", isMod: false, muted: false },
      { id: "DEMO-002", nama: "Andi Pratama", batch: "B35", role: "student", isMod: true, muted: false },
      { id: "DEMO-003", nama: "Sari Wulandari", batch: "B35", role: "student", isMod: false, muted: false },
      { id: "DEMO-004", nama: "Budi Santoso", batch: "B34", role: "student", isMod: false, muted: false },
      { id: "DEMO-005", nama: "Maya Lestari", batch: "B35", role: "student", isMod: false, muted: true },
      { id: "DEMO-006", nama: "Rizky Hidayat", batch: "B34", role: "student", isMod: false, muted: false }
    ];
    var threads = [
      { id: 1, category: "Pengumuman", title: "Selamat datang di Forum Small Group Richard!", body: "Halo semuanya! Ini forum uji coba.\n\nSilakan coba buat thread, komentar, unggah gambar, sematkan, atau kunci thread. Semua data hanya tersimpan di browser kamu.", authorId: "DEMO-ADMIN", pinned: true, locked: false, createdAt: ago(60 * 26), editedAt: null, lastActivityAt: ago(45) },
      { id: 2, category: "Tanya Jawab", title: "Cara bikin lead list yang rapi di Google Sheets?", body: "Kolom apa saja yang biasanya kalian pakai? Aku masih bingung bagian status follow-up.", authorId: "DEMO-003", pinned: false, locked: false, createdAt: ago(60 * 5), editedAt: null, lastActivityAt: ago(20) },
      { id: 3, category: "Tips", title: "Template caption IG yang sering aku pakai", body: "Hook singkat, 3 poin manfaat, lalu ajakan bertindak. Contoh lengkapnya di komentar ya.", authorId: "DEMO-002", pinned: false, locked: false, createdAt: ago(60 * 30), editedAt: ago(60 * 29), lastActivityAt: ago(60 * 28) },
      { id: 4, category: "Santai", title: "Kalian kerja sambil dengerin apa?", body: "Lagi cari playlist fokus nih, ada rekomendasi?", authorId: "DEMO-004", pinned: false, locked: true, createdAt: ago(60 * 50), editedAt: null, lastActivityAt: ago(60 * 48) }
    ];
    var comments = [
      { id: 1, threadId: 1, authorId: "DEMO-002", body: "Mantap, akhirnya ada forum!", createdAt: ago(60 * 25), editedAt: null },
      { id: 2, threadId: 1, authorId: "DEMO-003", body: "Siap, terima kasih Kak.", createdAt: ago(45), editedAt: null },
      { id: 3, threadId: 2, authorId: "DEMO-002", body: "Aku pakai: Nama, Platform, Link, Status (Baru / Dihubungi / Balas / Closing), Tanggal follow-up.", createdAt: ago(20), editedAt: null },
      { id: 4, threadId: 3, authorId: "DEMO-001", body: "Berguna banget, makasih!", createdAt: ago(60 * 28), editedAt: null },
      { id: 5, threadId: 4, authorId: "DEMO-006", body: "Lo-fi beats selalu aman.", createdAt: ago(60 * 48), editedAt: null }
    ];
    function dirItems(batch) {
      return [
        { no: "1", week: "Week 1", day: "Monday", department: "Course", pic: "Richard", when: "19.30 WIB", content: "Kickoff Batch " + batch + " & perkenalan", useful_links: "Slide kickoff\nhttps://www.canva.com/\nRekaman\nhttps://zoom.us/", product_updates: "", other_dept_updates: "", changes_log: "", date: "" },
        { no: "2", week: "Week 1", day: "Wednesday", department: "Product", pic: "Tim Product", when: "23.59 WIB", content: "Task 1: Profil & tujuan belajar", useful_links: "Form pengumpulan\nhttps://docs.google.com/forms/", product_updates: "Portal tugas sekarang mendukung unggah PDF.", other_dept_updates: "", changes_log: "", date: "" },
        { no: "3", week: "Week 2", day: "Monday", department: "Community", pic: "Richard", when: "19.30 WIB", content: "Live Lesson: Lead Generation dasar", useful_links: "Materi\nhttps://docs.google.com/document/", product_updates: "", other_dept_updates: "Community: jadwal Q&A pindah ke Kamis.", changes_log: "", date: "" },
        { no: "4", week: "Week 2", day: "Friday", department: "SA", pic: "Student Advisor", when: "23.59 WIB", content: "Task 2: Riset 20 calon klien", useful_links: "Template sheet\nhttps://docs.google.com/spreadsheets/", product_updates: "", other_dept_updates: "", changes_log: "Deadline diperpanjang 1 hari.", date: "12 Okt" },
        { no: "5", week: "Week 3", day: "Tuesday", department: "Course", pic: "Richard", when: "19.30 WIB", content: "Live Lesson: Social Media Management", useful_links: "Slide\nhttps://www.canva.com/", product_updates: "", other_dept_updates: "", changes_log: "", date: "" },
        { no: "6", week: "Week 4", day: "Thursday", department: "Product", pic: "Tim Product", when: "23.59 WIB", content: "Task 3: Buat 3 konten IG", useful_links: "Brief\nhttps://docs.google.com/document/", product_updates: "", other_dept_updates: "", changes_log: "", date: "" },
        { no: "7", week: "Week 5", day: "Monday", department: "Community", pic: "Alumni", when: "19.30 WIB", content: "Sharing session bersama alumni", useful_links: "Zoom\nhttps://zoom.us/", product_updates: "", other_dept_updates: "", changes_log: "", date: "" },
        { no: "8", week: "Week 6", day: "Friday", department: "SA", pic: "Student Advisor", when: "23.59 WIB", content: "Final task & portfolio review", useful_links: "Panduan portfolio\nhttps://docs.google.com/document/", product_updates: "", other_dept_updates: "", changes_log: "", date: "" }
      ];
    }
    function hof(batch) {
      return {
        fullScore: [
          { studentId: batch === "35" ? "DEMO-001" : "DEMO-006", name: batch === "35" ? "Demo Student" : "Rizky Hidayat", track: "LG", score: 5400, completion: 100 },
          { studentId: "X-" + batch + "-1", name: "Andi Pratama", track: "SMM", score: 5400, completion: 100 }
        ],
        completed: [
          { studentId: "X-" + batch + "-2", name: "Sari Wulandari", track: "EM", score: 5200, completion: 100 },
          { studentId: "X-" + batch + "-3", name: "Budi Santoso", track: "LG", score: 4950, completion: 100 }
        ]
      };
    }
    return {
      users: users, threads: threads, comments: comments, images: [],
      next: { thread: 5, comment: 6, image: 1, notif: 4 },
      batches: {
        "34": { db: "demo-db-34", directory: "demo-dir-34", hof: "demo-hof-34", hofEnabled: true },
        "35": { db: "demo-db-35", directory: "demo-dir-35", hof: "demo-hof-35", hofEnabled: true }
      },
      directory: { "34": dirItems("34"), "35": dirItems("35") },
      hof: { "34": hof("34"), "35": hof("35") },
      notifs: [
        { id: 1, batch: "35", kind: "Morning Message", title: "Selamat pagi, Batch 35!", body: "Jangan lupa Task 2 hari ini ya.", link_name: null, link_url: null, created_at: ago(60 * 3) },
        { id: 2, batch: "35", kind: "Sesi", title: "Live Lesson malam ini 19.30", body: "Link Zoom ada di Directory.", link_name: "Buka Directory", link_url: "https://example.com/", created_at: ago(60 * 26) },
        { id: 3, batch: "34", kind: "Pengumuman", title: "Pengumuman Batch 34", body: "Portfolio review dibuka minggu ini.", link_name: null, link_url: null, created_at: ago(60 * 50) }
      ]
    };
  }

  var db;
  try { db = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch (e) { db = null; }
  if (!db || !db.users) db = seed();
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); return true; } catch (e) { return false; }
  }
  save();

  // ---------- Helper ----------
  var digits = function (v) { return String(v == null ? "" : v).replace(/[^0-9]/g, ""); };
  var now = function () { return new Date().toISOString(); };
  function me() {
    var id = getRole() === "student" ? "DEMO-001" : "DEMO-ADMIN";
    var u = userById(id);
    var isAdmin = u.role === "admin";
    return { id: u.id, user: u, isAdmin: isAdmin, isMod: isAdmin || !!u.isMod, muted: !isAdmin && !!u.muted };
  }
  function userById(id) { for (var i = 0; i < db.users.length; i++) if (db.users[i].id === id) return db.users[i]; return null; }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function author(authorId, m) {
    var u = userById(authorId) || {};
    var isAdmin = u.role === "admin", b = digits(u.batch);
    return { name: u.nama || "Akun tidak aktif", batch: !isAdmin && b && b !== "0" ? "B" + b : "", badge: isAdmin ? "admin" : u.isMod ? "moderator" : "", mine: authorId === m.id };
  }
  function usedBytes() { return db.images.reduce(function (a, i) { return a + (i.size || 0); }, 0); }
  function meFull(m) {
    var out = { isAdmin: m.isAdmin, isMod: m.isMod, muted: m.muted, uploadsBlocked: false };
    if (m.isAdmin) out.storage = { level: "ok", percent: Math.round((usedBytes() / QUOTA) * 1000) / 10 };
    return out;
  }
  function imgsOf(fn) { return db.images.filter(fn).map(function (i) { return { id: i.id, url: i.url }; }); }
  function txt(v) { return (typeof v === "string" ? v : "").replace(/\r\n?/g, "\n").trim(); }
  function view(u) { var b = digits(u.batch); return { studentId: u.id, name: u.nama, batch: b && b !== "0" ? "B" + b : "" }; }
  function attachImages(ids, m, key, val) {
    (ids || []).forEach(function (id) {
      var img = find(db.images, Number(id));
      if (img && img.owner === m.id && !img.threadId && !img.commentId) img[key] = val;
    });
  }
  function ok(data) { data = data || {}; data.success = true; return { status: 200, json: data }; }
  function bad(msg, status) { return { status: status || 400, json: { error: msg } }; }

  // ---------- Rute ----------
  function route(method, path, q, body) {
    var m = me(), u = m.user, mt;

    // Login & sesi
    if (path === "/verify") return { status: 200, json: { valid: true, studentId: u.id, nama: u.nama, batch: u.batch, role: u.role } };
    if (path === "/login") return { status: 200, json: { token: DEMO_TOKEN, studentId: u.id, nama: u.nama, batch: u.batch } };
    if (path === "/register" || path === "/send-otp" || path === "/reset-password") return ok({ message: "Mode demo: tidak perlu akun." });

    // Directory & Hall of Fame
    if (path === "/directory") {
      var dBatch = m.isAdmin && q.get("batch") ? digits(q.get("batch")) : digits(u.batch);
      if (!db.batches[dBatch]) return bad("Directory batch " + dBatch + " belum terdaftar", 404);
      return ok({ batch: dBatch, items: db.directory[dBatch] || [] });
    }
    if (path === "/hall-of-fame") {
      var hBatch = m.isAdmin && q.get("batch") ? digits(q.get("batch")) : digits(u.batch);
      var cfg = db.batches[hBatch];
      if (!cfg || !cfg.hof) return bad("Hall of Fame batch " + hBatch + " belum tersedia", 404);
      if (cfg.hofEnabled === false) return bad("Hall of Fame batch " + hBatch + " belum diaktifkan", 404);
      var h = db.hof[hBatch] || { fullScore: [], completed: [] };
      return ok({ batch: hBatch, fullScore: h.fullScore, completed: h.completed });
    }

    // Fitur yang sudah dihapus
    if (path === "/me/dashboard" || path === "/me/task-tracker" || path === "/bonus-info") return bad("Fitur ini sudah dihapus", 404);

    // Admin: batch
    if (path.indexOf("/admin/") === 0 && !m.isAdmin) return bad("Forbidden", 403);
    if (path === "/admin/batches") return ok({ batches: Object.keys(db.batches).sort(function (a, b) { return a - b; }) });
    if (path === "/admin/batch-list") {
      return ok({ batches: Object.keys(db.batches).sort(function (a, b) { return a - b; }).map(function (k) {
        var c = db.batches[k]; return { batch: k, db: c.db, directory: c.directory, hof: c.hof, hofEnabled: c.hofEnabled };
      }) });
    }
    if (path === "/admin/batch" && method === "POST") {
      var key = digits(body.batch);
      if (!key) return bad("Nomor batch wajib diisi");
      if (!String(body.db || "").trim()) return bad("Link/ID Database Student tidak valid");
      if (!String(body.directory || "").trim()) return bad("Link/ID Directory tidak valid");
      var hofId = String(body.hof || "").trim();
      db.batches[key] = { db: String(body.db).trim(), directory: String(body.directory).trim(), hof: hofId || undefined, hofEnabled: !!body.hofEnabled && !!hofId };
      if (!db.directory[key]) db.directory[key] = [];
      if (!db.hof[key]) db.hof[key] = { fullScore: [], completed: [] };
      save();
      var saved = { batch: key }; for (var k2 in db.batches[key]) saved[k2] = db.batches[key][k2];
      return ok(saved);
    }
    if (path === "/admin/batch/delete" && method === "POST") {
      var dk = digits(body.batch);
      if (!dk) return bad("Nomor batch wajib diisi");
      delete db.batches[dk]; save();
      return ok({ batch: dk, deleted: true });
    }

    // Notifikasi (app HP)
    if (path === "/me/notifications") {
      var nb = m.isAdmin && q.get("batch") ? digits(q.get("batch")) : digits(u.batch);
      return ok({ batch: nb, items: db.notifs.filter(function (n) { return n.batch === nb; }).sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; }) });
    }
    if (path === "/admin/notification-batches") {
      var counts = {};
      db.users.forEach(function (x) { var b = digits(x.batch); if (x.role !== "admin" && b) counts[b] = (counts[b] || 0) + 1; });
      return ok({ kinds: KINDS, batches: Object.keys(counts).sort().map(function (b) { return { batch: b, students: counts[b] }; }) });
    }
    if (path === "/admin/notifications" && method === "POST") {
      var tb = digits(body.batch), title = String(body.title || "").trim(), nbody = String(body.body || "").trim();
      var linkUrl = String(body.linkUrl || "").trim();
      if (!tb) return bad("Pilih batch tujuan");
      if (KINDS.indexOf(body.kind) < 0) return bad("Kategori tidak dikenal");
      if (!title) return bad("Judul wajib diisi");
      if (!nbody) return bad("Isi pesan wajib diisi");
      if (linkUrl && !/^https:\/\/\S+$/i.test(linkUrl)) return bad("Link harus diawali https://");
      var recipients = db.users.filter(function (x) { return x.role !== "admin" && digits(x.batch) === tb; }).length;
      if (!recipients) return bad("Tidak ada student aktif di Batch " + tb);
      var n = { id: db.next.notif++, batch: tb, kind: body.kind, title: title, body: nbody, link_name: linkUrl ? (String(body.linkName || "").trim() || "Buka link") : null, link_url: linkUrl || null, created_by: m.id, created_at: now() };
      db.notifs.push(n); save();
      return ok({ id: n.id, batch: tb, recipients: recipients, created_at: n.created_at });
    }
    if (path === "/admin/notifications") {
      var ab = digits(q.get("batch"));
      if (!ab) return bad("Parameter batch wajib diisi");
      return ok({ batch: ab, items: db.notifs.filter(function (n) { return n.batch === ab; }).sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; }) });
    }
    if (path === "/admin/notifications/delete" && method === "POST") {
      var before = db.notifs.length;
      db.notifs = db.notifs.filter(function (n) { return n.id !== Number(body.id); });
      if (db.notifs.length === before) return bad("Pesan tidak ditemukan", 404);
      save(); return ok({ id: Number(body.id) });
    }

    // ---------- Forum ----------
    if (path === "/forum/threads" && method === "GET") {
      var cat = CATEGORIES.indexOf(q.get("category")) >= 0 ? q.get("category") : null;
      var term = txt(q.get("q")).toLowerCase();
      var page = Math.max(1, parseInt(q.get("page"), 10) || 1);
      var list = db.threads.filter(function (t) {
        return (!cat || t.category === cat) && (!term || (t.title + " " + t.body).toLowerCase().indexOf(term) >= 0);
      }).sort(function (a, b) {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.lastActivityAt !== b.lastActivityAt) return a.lastActivityAt < b.lastActivityAt ? 1 : -1;
        return b.id - a.id;
      });
      var slice = list.slice((page - 1) * 30, page * 30);
      return ok({
        items: slice.map(function (t) {
          return { id: t.id, category: t.category, title: t.title, pinned: t.pinned, locked: t.locked, createdAt: t.createdAt, editedAt: t.editedAt, lastActivityAt: t.lastActivityAt,
            commentCount: db.comments.filter(function (c) { return c.threadId === t.id; }).length,
            imageCount: db.images.filter(function (i) { return i.threadId === t.id; }).length,
            author: author(t.authorId, m) };
        }),
        page: page, hasMore: list.length > page * 30, categories: CATEGORIES, me: meFull(m)
      });
    }
    if (path === "/forum/threads" && method === "POST") {
      if (m.muted) return bad("Kamu sedang dibisukan oleh moderator", 403);
      var title2 = txt(body.title), tbody = txt(body.body);
      if (CATEGORIES.indexOf(body.category) < 0) return bad("Kategori tidak dikenal");
      if (body.category === "Pengumuman" && !m.isMod) return bad("Kategori Pengumuman khusus admin dan moderator", 403);
      if (!title2) return bad("Judul wajib diisi");
      if (!tbody) return bad("Isi thread wajib diisi");
      var t2 = { id: db.next.thread++, category: body.category, title: title2.slice(0, 150), body: tbody.slice(0, 10000), authorId: m.id,
        pinned: m.isMod && body.pinned === true, locked: m.isMod && body.locked === true, createdAt: now(), editedAt: null, lastActivityAt: now() };
      db.threads.push(t2);
      attachImages(body.imageIds, m, "threadId", t2.id);
      save(); return ok({ id: t2.id });
    }
    if ((mt = path.match(/^\/forum\/threads\/(\d+)$/))) {
      var th = find(db.threads, Number(mt[1]));
      if (!th) return bad("Thread tidak ditemukan", 404);
      var a = author(th.authorId, m);
      return ok({
        me: meFull(m),
        thread: { id: th.id, category: th.category, title: th.title, body: th.body, pinned: th.pinned, locked: th.locked, createdAt: th.createdAt, editedAt: th.editedAt, author: a,
          images: imgsOf(function (i) { return i.threadId === th.id; }), canEdit: a.mine, canDelete: a.mine || m.isMod },
        comments: db.comments.filter(function (c) { return c.threadId === th.id; }).sort(function (x, y) { return x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : x.id - y.id; }).map(function (c) {
          var ca = author(c.authorId, m);
          return { id: c.id, body: c.body, createdAt: c.createdAt, editedAt: c.editedAt, author: ca, images: imgsOf(function (i) { return i.commentId === c.id; }), canEdit: ca.mine, canDelete: ca.mine || m.isMod };
        })
      });
    }
    if ((mt = path.match(/^\/forum\/threads\/(\d+)\/(edit|delete|moderate|comments)$/)) && method === "POST") {
      var t3 = find(db.threads, Number(mt[1]));
      if (!t3) return bad("Thread tidak ditemukan", 404);
      var own = t3.authorId === m.id;
      if (mt[2] === "edit") {
        if (!own) return bad("Hanya penulis yang bisa mengedit", 403);
        if (m.muted) return bad("Kamu sedang dibisukan oleh moderator", 403);
        var cat2 = typeof body.category === "string" ? body.category : t3.category;
        if (CATEGORIES.indexOf(cat2) < 0) return bad("Kategori tidak dikenal");
        if (cat2 === "Pengumuman" && cat2 !== t3.category && !m.isMod) return bad("Kategori Pengumuman khusus admin dan moderator", 403);
        if (!txt(body.title) || !txt(body.body)) return bad("Judul dan isi wajib diisi");
        t3.category = cat2; t3.title = txt(body.title).slice(0, 150); t3.body = txt(body.body).slice(0, 10000); t3.editedAt = now();
      } else if (mt[2] === "delete") {
        if (!own && !m.isMod) return bad("Tidak diizinkan", 403);
        var cids = db.comments.filter(function (c) { return c.threadId === t3.id; }).map(function (c) { return c.id; });
        db.images = db.images.filter(function (i) { return i.threadId !== t3.id && cids.indexOf(i.commentId) < 0; });
        db.comments = db.comments.filter(function (c) { return c.threadId !== t3.id; });
        db.threads = db.threads.filter(function (t) { return t.id !== t3.id; });
      } else if (mt[2] === "moderate") {
        if (!m.isMod) return bad("Tidak diizinkan", 403);
        if (typeof body.pinned === "boolean") t3.pinned = body.pinned;
        if (typeof body.locked === "boolean") t3.locked = body.locked;
      } else {
        if (m.muted) return bad("Kamu sedang dibisukan oleh moderator", 403);
        if (t3.locked && !m.isMod) return bad("Thread ini dikunci. Komentar baru tidak bisa ditambahkan.", 403);
        var cb = txt(body.body), ids = body.imageIds || [];
        if (!cb && !ids.length) return bad("Komentar tidak boleh kosong");
        var cm = { id: db.next.comment++, threadId: t3.id, authorId: m.id, body: cb.slice(0, 3000), createdAt: now(), editedAt: null };
        db.comments.push(cm);
        attachImages(ids, m, "commentId", cm.id);
        t3.lastActivityAt = now();
        save(); return ok({ id: cm.id });
      }
      save(); return ok({ id: t3.id });
    }
    if ((mt = path.match(/^\/forum\/comments\/(\d+)\/(edit|delete)$/)) && method === "POST") {
      var c4 = find(db.comments, Number(mt[1]));
      if (!c4) return bad("Komentar tidak ditemukan", 404);
      var own4 = c4.authorId === m.id;
      if (mt[2] === "edit") {
        if (!own4) return bad("Hanya penulis yang bisa mengedit", 403);
        var eb = txt(body.body);
        if (!eb && !db.images.some(function (i) { return i.commentId === c4.id; })) return bad("Komentar tidak boleh kosong");
        c4.body = eb.slice(0, 3000); c4.editedAt = now();
      } else {
        if (!own4 && !m.isMod) return bad("Tidak diizinkan", 403);
        db.images = db.images.filter(function (i) { return i.commentId !== c4.id; });
        db.comments = db.comments.filter(function (c) { return c.id !== c4.id; });
      }
      save(); return ok({ id: c4.id });
    }
    if (path === "/forum/mute" && method === "POST") {
      if (!m.isMod) return bad("Tidak diizinkan", 403);
      if (typeof body.muted !== "boolean") return bad("Data tidak valid");
      var target = null;
      if (body.threadId) { var tt = find(db.threads, Number(body.threadId)); target = tt && tt.authorId; }
      else if (body.commentId) { var cc = find(db.comments, Number(body.commentId)); target = cc && cc.authorId; }
      else if (m.isAdmin && typeof body.studentId === "string") target = body.studentId.trim();
      var tu = target && userById(target);
      if (!tu) return bad("Pengguna tidak ditemukan", 404);
      if (tu.role === "admin" || tu.id === m.id) return bad("Pengguna ini tidak bisa dibisukan", 403);
      if (tu.isMod && !m.isAdmin) return bad("Hanya admin yang bisa membisukan moderator", 403);
      tu.muted = body.muted; save();
      return ok({ muted: body.muted });
    }
    if (path === "/forum/storage") {
      if (!m.isAdmin) return bad("Forbidden", 403);
      var used = usedBytes(), pending = db.images.filter(function (i) { return !i.threadId && !i.commentId; });
      var byThread = {};
      db.images.forEach(function (i) {
        var tid = i.threadId || (find(db.comments, i.commentId) || {}).threadId;
        if (!tid) return;
        byThread[tid] = byThread[tid] || { images: 0, bytes: 0 };
        byThread[tid].images++; byThread[tid].bytes += i.size || 0;
      });
      return ok({
        usedBytes: used, quotaBytes: QUOTA, imageCount: db.images.length, percent: Math.round((used / QUOTA) * 1000) / 10, level: "ok", warnAt: 80, blockAt: 95,
        unpostedImages: pending.length, unpostedBytes: pending.reduce(function (s, i) { return s + (i.size || 0); }, 0),
        topThreads: Object.keys(byThread).map(function (tid) {
          var t = find(db.threads, Number(tid)) || {};
          return { id: Number(tid), title: t.title, category: t.category, author: (userById(t.authorId) || {}).nama || "Akun tidak aktif", images: byThread[tid].images, bytes: byThread[tid].bytes, lastActivityAt: t.lastActivityAt };
        }).sort(function (x, y) { return y.bytes - x.bytes; }).slice(0, 10)
      });
    }
    if (path === "/forum/storage/cleanup" && method === "POST") {
      if (!m.isAdmin) return bad("Forbidden", 403);
      var months = parseInt(body.months, 10);
      if (!months || months < 1 || months > 36) return bad("Pilih umur gambar 1 sampai 36 bulan");
      var cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);
      var old = db.images.filter(function (i) { return new Date(i.createdAt) < cutoff; });
      var bytes = old.reduce(function (s, i) { return s + (i.size || 0); }, 0);
      if (body.dryRun === true) return ok({ dryRun: true, count: old.length, bytes: bytes });
      db.images = db.images.filter(function (i) { return old.indexOf(i) < 0; }); save();
      return ok({ count: old.length, bytes: bytes });
    }
    if (path === "/forum/moderators" && method === "GET") {
      if (!m.isAdmin) return bad("Forbidden", 403);
      var byName = function (x, y) { return x.nama.localeCompare(y.nama, "id"); };
      return ok({
        admins: db.users.filter(function (x) { return x.role === "admin"; }).sort(byName).map(view),
        moderators: db.users.filter(function (x) { return x.isMod && x.role !== "admin"; }).sort(byName).map(view),
        muted: db.users.filter(function (x) { return x.muted; }).sort(byName).map(view)
      });
    }
    if (path === "/forum/moderator-candidates") {
      if (!m.isAdmin) return bad("Forbidden", 403);
      var cq = txt(q.get("q")).toLowerCase();
      if (cq.length < 2) return ok({ items: [] });
      return ok({ items: db.users.filter(function (x) {
        return x.role !== "admin" && !x.isMod && (x.id.toLowerCase() === cq || x.nama.toLowerCase().indexOf(cq) >= 0);
      }).map(function (x) { return { studentId: x.id, name: x.nama, batch: digits(x.batch) ? "B" + digits(x.batch) : "" }; }) });
    }
    if (path === "/forum/moderators" && method === "POST") {
      if (!m.isAdmin) return bad("Forbidden", 403);
      var mu = userById(String(body.studentId || "").trim());
      if (!mu) return bad("Student tidak ditemukan", 404);
      if (mu.role === "admin") return bad("Admin tidak perlu dijadikan moderator");
      if (body.action !== "add" && body.action !== "remove") return bad("Data tidak valid");
      mu.isMod = body.action === "add"; save();
      return ok({});
    }

    return bad("Mode demo: rute " + path + " belum tersedia", 404);
  }

  // Unggah gambar forum: disimpan sebagai data URL di localStorage.
  function upload(blob) {
    var m = me();
    if (m.muted) return Promise.resolve(bad("Kamu sedang dibisukan oleh moderator", 403));
    if (!blob || !blob.size) return Promise.resolve(bad("File kosong"));
    if (blob.size > 2 * 1024 * 1024) return Promise.resolve(bad("Ukuran gambar maksimal 2 MB", 413));
    if (!/^image\/(jpeg|png|webp)$/.test(blob.type)) return Promise.resolve(bad("Hanya gambar JPG, PNG, atau WebP", 415));
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () {
        var img = { id: db.next.image++, url: r.result, owner: m.id, size: blob.size, threadId: null, commentId: null, createdAt: now() };
        db.images.push(img);
        if (!save()) {
          db.images.pop();
          return resolve(bad("Penyimpanan browser penuh (mode demo). Klik DEMO → Reset data.", 507));
        }
        resolve(ok({ id: img.id, url: img.url }));
      };
      r.onerror = function () { resolve(bad("Gagal membaca gambar")); };
      r.readAsDataURL(blob);
    });
  }

  // ---------- Sadap fetch ke Worker ----------
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input && input.url ? input.url : String(input);
    if (url.indexOf(API_URL) !== 0) return realFetch(input, init);
    init = init || {};
    var u = new URL(url);
    var method = String(init.method || "GET").toUpperCase();
    var signal = init.signal;
    var work;
    if (u.pathname === "/forum/images" && method === "POST") {
      work = upload(init.body);
    } else {
      var body = {};
      if (typeof init.body === "string") { try { body = JSON.parse(init.body) || {}; } catch (e) { body = {}; } }
      var res;
      try { res = route(method, u.pathname, u.searchParams, body); } catch (e) { res = bad("Mode demo error: " + e.message, 500); }
      work = Promise.resolve(res);
    }
    return work.then(function (res) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { // jeda kecil supaya status "memuat" tetap terlihat
          if (signal && signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
          resolve(new Response(JSON.stringify(res.json), { status: res.status, headers: { "Content-Type": "application/json" } }));
        }, 120);
      });
    });
  };

  // ---------- Tombol DEMO (ganti peran / reset data) ----------
  function mountBadge() {
    if (document.getElementById("sgrDemoBadge")) return;
    var inApp = /\/app\//.test(location.pathname);
    var wrap = document.createElement("div");
    wrap.id = "sgrDemoBadge";
    wrap.style.cssText = "position:fixed;left:12px;bottom:" + (inApp ? "96px" : "12px") + ";z-index:2147483000;font:600 12px/1.2 system-ui,sans-serif;display:flex;flex-direction:column;align-items:flex-start;gap:6px;";
    var role = getRole();
    var btnCss = "border:1px solid rgba(247,183,51,.55);background:#1a1508;color:#f7b733;border-radius:999px;padding:7px 12px;cursor:pointer;font:inherit;box-shadow:0 4px 14px rgba(0,0,0,.35);";
    var panel = document.createElement("div");
    panel.style.cssText = "display:none;flex-direction:column;gap:6px;";
    function item(label, fn) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = label; b.style.cssText = btnCss; b.onclick = fn;
      panel.appendChild(b);
    }
    item("Masuk sebagai " + (role === "admin" ? "Student" : "Admin"), function () {
      try { localStorage.setItem(ROLE_KEY, role === "admin" ? "student" : "admin"); } catch (e) {}
      location.reload();
    });
    item("Reset data contoh", function () {
      if (!confirm("Hapus semua perubahan di mode demo dan kembali ke data contoh awal?")) return;
      try { localStorage.removeItem(DB_KEY); } catch (e) {}
      location.reload();
    });
    var main = document.createElement("button");
    main.type = "button";
    main.title = "Mode uji coba: tanpa login, data hanya di browser ini";
    main.textContent = "DEMO · " + (role === "admin" ? "Admin" : "Student");
    main.style.cssText = btnCss + "font-weight:800;letter-spacing:.03em;";
    main.onclick = function () { panel.style.display = panel.style.display === "none" ? "flex" : "none"; };
    wrap.appendChild(panel);
    wrap.appendChild(main);
    document.body.appendChild(wrap);
  }
  if (document.body) mountBadge();
  else document.addEventListener("DOMContentLoaded", mountBadge);
})();
