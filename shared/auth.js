// shared/auth.js
// Dipakai di semua halaman terproteksi (Dashboard, Directory, Hall of Fame, Tracker)

const API_URL = "https://sgr-backend.richweinz27.workers.dev";

// Cache singkat hasil verifikasi, supaya pindah antar halaman (Dashboard <->
// Directory <-> Task Tracker <-> Hall of Fame) tidak perlu menghubungi ulang
// Worker setiap kali — cukup dalam jendela waktu ini.
const SESSION_CACHE_KEY = "sgr_session_cache";
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit — boleh diubah sesuai kebutuhan

function getCachedSession(token) {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.token !== token) return null; // token beda -> cache tidak valid
    if (Date.now() - parsed.ts > SESSION_CACHE_TTL_MS) return null; // sudah kadaluarsa
    return parsed.session;
  } catch (e) {
    return null;
  }
}

function setCachedSession(token, session) {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ token, ts: Date.now(), session }));
  } catch (e) {
    // storage penuh/diblok -> abaikan, tidak fatal
  }
}

/**
 * Cek token login yang tersimpan di sessionStorage.
 * Kalau valid -> resolve dengan { studentId, nama, batch, isAdmin, role, token }
 * Kalau tidak valid / tidak ada -> otomatis redirect ke halaman login
 *
 * Status admin SEKARANG ditentukan oleh Worker (dari kolom `role` di database),
 * bukan daftar ID hardcode di file ini. Menambah admin baru cukup lewat SQL
 * di Neon (UPDATE users SET role='admin' WHERE student_id=...), tidak perlu
 * sentuh file ini lagi.
 */
// Baca waktu kedaluwarsa (exp, detik) dari payload JWT. Hanya untuk UX auto-logout;
// keamanan sebenarnya tetap dicek Worker (token kedaluwarsa -> 401).
function getTokenExpMs(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const exp = JSON.parse(atob(b64)).exp;
    return exp ? exp * 1000 : null;
  } catch (e) {
    return null;
  }
}

let sessionTimer = null;
function scheduleAutoLogout(token) {
  const expMs = getTokenExpMs(token);
  if (!expMs) return;
  clearTimeout(sessionTimer);
  // setTimeout maksimal ~24.8 hari; sesi kita <= 24 jam jadi aman.
  sessionTimer = setTimeout(() => {
    alert("Sesi kamu sudah berakhir. Silakan login lagi.");
    logout();
  }, Math.max(0, expMs - Date.now()));
}

async function checkLogin() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    window.location.href = "../login/";
    return null;
  }

  const expMs = getTokenExpMs(token);
  if (expMs && expMs <= Date.now()) {
    logout();
    return null;
  }
  scheduleAutoLogout(token);

  // Pakai cache dulu kalau masih segar -> lompati panggilan ke Worker sama sekali
  const cached = getCachedSession(token);
  if (cached) {
    return cached;
  }

  try {
    const res = await fetch(`${API_URL}/verify?token=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (!data.valid) {
      sessionStorage.removeItem("token");
      window.location.href = "../login/";
      return null;
    }

    const session = {
      studentId: data.studentId,
      nama: data.nama,
      batch: data.batch,
      role: data.role || "student",
      isAdmin: data.role === "admin",
      token,
    };
    setCachedSession(token, session);
    return session;
  } catch (err) {
    console.error("Gagal verifikasi login:", err);
    window.location.href = "../login/";
    return null;
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem(SESSION_CACHE_KEY);
  sessionStorage.removeItem(ADMIN_VIEW_KEY);
  window.location.href = "../login/";
}

// ============ ADMIN "SEDANG MENINJAU" STATE ============
// Dipakai supaya ketika Admin search seorang Student di satu halaman
// (Dashboard/Task Tracker/dst), lalu pindah ke halaman lain, halaman
// tsb bisa otomatis menampilkan Student yang sama tanpa perlu search ulang.
// Cukup simpan ID + nama + batch (bukan seluruh data), tiap halaman
// tetap fetch datanya sendiri-sendiri supaya selalu fresh.
const ADMIN_VIEW_KEY = "sgr_admin_viewing";

function setAdminViewing(studentId, nama, batch) {
  try {
    sessionStorage.setItem(
      ADMIN_VIEW_KEY,
      JSON.stringify({ studentId: String(studentId || "").trim(), nama: nama || "", batch: batch || "" })
    );
  } catch (e) {
    // storage penuh/diblok -> abaikan, tidak fatal
  }
}

function getAdminViewing() {
  try {
    const raw = sessionStorage.getItem(ADMIN_VIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.studentId) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function clearAdminViewing() {
  try {
    sessionStorage.removeItem(ADMIN_VIEW_KEY);
  } catch (e) {
    // storage penuh/diblok -> abaikan, tidak fatal
  }
}