import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { enableWebsiteLogin } from './api.js';
import ForumApp from './forum/ForumApp.jsx';
import './styles.css';
import './forum-desktop.css';

// Pakai sesi login website (sessionStorage 'token'), bukan sesi app HP.
enableWebsiteLogin();

function logout() {
  if (typeof window.logout === 'function') window.logout();
  else { try { sessionStorage.removeItem('token'); } catch { /* abaikan */ } window.location.href = '../login/'; }
}

// Forum = halaman utama website. Dashboard & Task Tracker sudah dihapus (dialihkan ke sini).
const NAV = [
  ['Directory', '../directory/'],
  ['Hall of Fame', '../hall-of-fame/']
];

function Shell({ session }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const showToast = useCallback((msg) => {
    clearTimeout(timer.current);
    setToast(msg);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  const name = session.nama || 'Student';
  const ini = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

  return (
    <div className="desk">
      <header className="desk-nav">
        <a className="desk-brand" href="./">
          <span className="desk-logo"><img src="../app/logo-icon.png" alt="" /></span>
          <span className="syne">SG Richard Dashboard</span>
        </a>
        <nav className="desk-links" aria-label="Menu utama">
          <a href="./" aria-current="page" className="on">Forum</a>
          {NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          {session.isAdmin && <a href="../admin/batches/">Kelola Batch</a>}
        </nav>
        <div className="desk-user">
          <span className="desk-avatar">{ini}</span>
          <span className="desk-name">{name}</span>
          {session.isAdmin && <span className="f-badge f-badge-admin">ADMIN</span>}
          <button type="button" className="desk-logout" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="desk-main">
        <ForumApp desktop showToast={showToast} onAuthError={logout} />
      </main>
      {toast && (
        <div className="toast" role="status">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2fd0a3', flex: 'none' }} />{toast}
        </div>
      )}
    </div>
  );
}

async function boot() {
  const root = createRoot(document.getElementById('root'));
  root.render(<div className="desk-loading"><span className="spinner" />Memeriksa login…</div>);
  if (typeof window.checkLogin !== 'function') {
    root.render(<div className="desk-loading">Gagal memuat sistem login. Muat ulang halaman ini.</div>);
    return;
  }
  let session = null;
  try { session = await window.checkLogin(); } catch { session = null; }
  if (!session) return; // checkLogin sudah mengarahkan ke halaman login
  root.render(<StrictMode><Shell session={session} /></StrictMode>);
}
boot();
