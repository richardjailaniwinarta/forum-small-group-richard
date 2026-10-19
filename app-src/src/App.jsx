import { useEffect, useState } from 'react';
import { clearSession, getToken, verifySession } from './api.js';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';

export default function App() {
  // undefined = sedang cek token, null = belum login
  const [session, setSession] = useState(() => (getToken() ? undefined : null));

  useEffect(() => {
    if (session !== undefined) return;
    verifySession()
      .then(setSession)
      // Gagal memverifikasi (server tidak terjangkau, dsb.) = TIDAK dianggap login. Minta login ulang.
      .catch(() => { clearSession(); setSession(null); });
  }, [session]);

  const logout = () => { clearSession(); setSession(null); };

  return (
    <div className="stage">
      <div className="phone">
        {session === undefined ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading" style={{ background: 'transparent' }}><span className="spinner" />Memeriksa sesi…</div>
          </div>
        ) : session ? (
          <Dashboard session={session} onLogout={logout} />
        ) : (
          <Login onLogin={setSession} />
        )}
      </div>
    </div>
  );
}
