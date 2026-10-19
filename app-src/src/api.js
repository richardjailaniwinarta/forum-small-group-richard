// Klien untuk Worker backend yang sama dengan website (login/, dashboard/, task-tracker/, directory/).
export const API_URL = (import.meta.env.VITE_API_URL || 'https://sgr-backend.richweinz27.workers.dev').replace(/\/$/, '');
export const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'sgr_app_token';
const SESSION_KEY = 'sgr_app_session';
const TIMEOUT_MS = 15000;

// KEAMANAN: token disimpan di sessionStorage, yang otomatis terhapus saat browser/app ditutup.
// Jadi setiap membuka app lagi, student harus login ulang. JANGAN diganti ke localStorage.
// Versi lama menyimpan token di localStorage; sisa token itu dihapus di sini.
try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSION_KEY); } catch { /* abaikan */ }

// Halaman forum di website laptop memakai token login website (sessionStorage 'token').
let tokenKey = TOKEN_KEY;
export function enableWebsiteLogin() { tokenKey = 'token'; }

export function getToken() {
  try { return sessionStorage.getItem(tokenKey); } catch { return null; }
}

function storeSession(session) {
  try {
    sessionStorage.setItem(TOKEN_KEY, session.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* storage diblok -> sesi hanya bertahan selama app terbuka */ }
}

export function clearSession() {
  try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(SESSION_KEY); } catch { /* abaikan */ }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function networkMessage(err) {
  if (err.name === 'AbortError') return 'Server terlalu lama merespons. Coba lagi beberapa saat.';
  return 'Gagal terhubung ke server. Periksa koneksi internet kamu, lalu coba lagi.';
}

export class AuthError extends Error {}

// Kirim request login; ulangi sekali kalau timeout / gagal konek (sama seperti login/ di website).
export async function login(studentId, password) {
  let lastErr;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetchWithTimeout(API_URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password })
      });
      const raw = await res.text();
      let data = null;
      try { data = JSON.parse(raw); } catch { /* bukan JSON */ }
      if (!data) {
        const err = new Error('Server sedang bermasalah. Coba lagi beberapa saat.');
        err.retryable = true;
        throw err;
      }
      if (data.error) throw new Error(data.error);
      const session = {
        token: data.token, studentId: String(data.studentId ?? studentId),
        nama: data.nama || '', batch: data.batch ?? '', role: data.role || 'student'
      };
      storeSession(session);
      // Respons /login tidak memuat role. Ambil role (admin/student) dari /verify supaya tampilan langsung benar.
      const verified = await verifySession();
      if (!verified) throw new Error('Gagal memverifikasi login. Coba lagi.');
      return verified;
    } catch (err) {
      lastErr = err;
      const retryable = err.name === 'AbortError' || err.name === 'TypeError' || err.retryable;
      if (!retryable || attempt === 1) break;
    }
  }
  if (lastErr.name === 'AbortError' || lastErr.name === 'TypeError') throw new Error(networkMessage(lastErr));
  throw lastErr;
}

// Cek token tersimpan ke /verify. Resolve null kalau token tidak valid.
export async function verifySession() {
  const token = getToken();
  if (!token) return null;
  const res = await fetchWithTimeout(API_URL + '/verify?token=' + encodeURIComponent(token));
  const data = await res.json().catch(() => ({}));
  if (!data.valid) { clearSession(); return null; }
  const session = {
    token, studentId: String(data.studentId ?? ''), nama: data.nama || '',
    batch: data.batch ?? '', role: data.role || 'student'
  };
  storeSession(session);
  return session;
}

export async function apiGet(path) {
  const token = getToken();
  let res;
  try {
    res = await fetchWithTimeout(API_URL + path, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  } catch (err) {
    throw new Error(networkMessage(err));
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401 || res.status === 403) throw new AuthError((data && data.error) || 'Sesi berakhir. Silakan login lagi.');
  if (!data) throw new Error('Respon server tidak valid.');
  if (!res.ok || data.error || data.success === false) throw new Error(data.error || 'Gagal mengambil data dari server.');
  return data;
}

export async function apiPost(path, body) {
  const token = getToken();
  let res;
  try {
    res = await fetchWithTimeout(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(networkMessage(err));
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401) throw new AuthError((data && data.error) || 'Sesi berakhir. Silakan login lagi.');
  if (!data) throw new Error('Respon server tidak valid.');
  if (!res.ok || data.error || data.success === false) throw new Error(data.error || 'Gagal menyimpan ke server.');
  return data;
}

// Unggah file mentah (gambar forum). Body = isi file, Content-Type = jenis file.
export async function apiUpload(path, blob) {
  const token = getToken();
  let res;
  try {
    res = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'application/octet-stream', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: blob
    });
  } catch (err) {
    throw new Error(networkMessage(err));
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401) throw new AuthError((data && data.error) || 'Sesi berakhir. Silakan login lagi.');
  if (!data || !res.ok || data.error) throw new Error((data && data.error) || 'Gagal mengunggah gambar.');
  return data;
}
