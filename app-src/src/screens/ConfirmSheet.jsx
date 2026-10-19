import { useEffect, useState } from 'react';

// Panel konfirmasi dari bawah (gaya sama dengan konfirmasi logout).
export default function ConfirmSheet({ title, text, confirmLabel, danger, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => { setBusy(false); }, [title]);
  const go = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
  return (
    <div className="sheet-backdrop">
      <div style={{ flex: 1 }} onClick={() => !busy && onCancel()} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="cs-title">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#6c63ff,#f7b733,transparent)' }} />
        <div>
          <div id="cs-title" className="syne" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: '#808a9e', marginTop: 6 }}>{text}</div>
        </div>
        <div className="grid-2" style={{ gap: 10, marginTop: 6 }}>
          <button onClick={onCancel} disabled={busy} className="nowrap" style={{ height: 50, borderRadius: 12, background: '#171d2b', border: '1px solid rgba(255,255,255,0.10)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Batal</button>
          <button onClick={go} disabled={busy} className="nowrap"
            style={{ height: 50, border: 0, borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: danger ? 'linear-gradient(135deg,#f87171,#e0457b)' : 'linear-gradient(135deg,#6c63ff 0%,#8b5cf6 50%,#a78bfa 100%)' }}>
            {busy && <span className="spinner" />}{busy ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
