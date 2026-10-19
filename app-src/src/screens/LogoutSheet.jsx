import { useEffect, useRef, useState } from 'react';
import { LogoutIcon } from '../components/Icons.jsx';

export default function LogoutSheet({ onCancel, onConfirm }) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const cancel = () => { if (!leaving) onCancel(); };
  const confirm = () => {
    setLeaving(true);
    timer.current = setTimeout(onConfirm, 700);
  };

  return (
    <div className="sheet-backdrop">
      <div style={{ flex: 1 }} onClick={cancel} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#6c63ff,#f7b733,transparent)' }} />
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoutIcon width={22} height={22} /></div>
        <div>
          <div id="logout-title" className="syne" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>Keluar dari akun?</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: '#808a9e', marginTop: 6 }}>Kamu perlu login lagi dengan Student ID dan password untuk mengakses dashboard.</div>
        </div>
        <div className="grid-2" style={{ gap: 10, marginTop: 6 }}>
          <button onClick={cancel} className="nowrap" style={{ height: 50, borderRadius: 12, background: '#171d2b', border: '1px solid rgba(255,255,255,0.10)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Batal</button>
          <button onClick={confirm} disabled={leaving} className="nowrap" style={{ height: 50, border: 0, borderRadius: 12, background: 'linear-gradient(135deg,#f87171,#e0457b)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px -10px rgba(248,113,113,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {leaving && <span className="spinner" />}{leaving ? 'Keluar…' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
