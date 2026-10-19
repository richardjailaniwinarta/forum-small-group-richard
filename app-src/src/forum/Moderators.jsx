import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost, AuthError } from '../api.js';
import { ArrowLeft, Search } from '../components/Icons.jsx';
import ConfirmSheet from '../screens/ConfirmSheet.jsx';
import { ErrorBox } from '../screens/Today.jsx';
import { Avatar, fmtBytes, timeAgo } from './shared.jsx';

function Person({ p, sub, action }) {
  return (
    <div className="f-person">
      <Avatar name={p.name} size={36} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
        <span className="f-name strong">{p.name}</span>
        <span className="f-muted">{sub}</span>
      </span>
      {action}
    </div>
  );
}

const pct = (n) => String(n).replace('.', ',') + '%';
const METER = { ok: '#2fd0a3', warn: '#f7b733', block: '#f87171' };

// Penyimpanan gambar forum (R2): meteran, thread dengan gambar terbanyak, dan hapus gambar lama.
function Storage({ onOpenThread, showToast, fail }) {
  const [st, setSt] = useState(null);
  const [err, setErr] = useState(null);
  const [months, setMonths] = useState(6);
  const [preview, setPreview] = useState(null); // hasil "cek dulu"
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try { setSt(await apiGet('/forum/storage')); setErr(null); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPreview(null); }, [months]);

  const check = async () => {
    try { setPreview(await apiPost('/forum/storage/cleanup', { months, dryRun: true })); } catch (e) { fail(e); }
  };
  const run = async () => {
    try {
      const r = await apiPost('/forum/storage/cleanup', { months });
      showToast(`${r.count} gambar dihapus (${fmtBytes(r.bytes)} lega)`);
      setConfirm(null); setPreview(null); load();
    } catch (e) { fail(e); }
  };

  if (!st) return err ? <ErrorBox msg={'Gagal memuat penyimpanan: ' + err} onRetry={load} /> : <div className="loading"><span className="spinner" />Memuat penyimpanan…</div>;
  const color = METER[st.level];
  return (
    <div className="f-section">
      <div className="eyebrow">Penyimpanan gambar</div>
      <div className="f-side-card" style={{ borderColor: st.level === 'ok' ? undefined : color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className="syne" style={{ fontWeight: 800, fontSize: 22, color }}>{pct(st.percent)}</span>
          <span className="f-muted">{fmtBytes(st.usedBytes)} dari {fmtBytes(st.quotaBytes)} · {st.imageCount.toLocaleString('id-ID')} gambar</span>
        </div>
        <div className="f-meter" role="img" aria-label={'Terpakai ' + pct(st.percent)}>
          <span style={{ width: Math.min(100, st.percent) + '%', background: color }} />
          <i style={{ left: st.warnAt + '%' }} /><i style={{ left: st.blockAt + '%' }} />
        </div>
        <div className="f-muted" style={{ whiteSpace: 'normal' }}>Garis penanda: peringatan di {st.warnAt}%, unggah diblokir di {st.blockAt}%.</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: st.level === 'ok' ? 'var(--soft)' : color }}>
          {st.level === 'block' ? 'Unggah gambar DIBLOKIR untuk semua orang. Hapus sebagian gambar di bawah sampai di bawah 95%.'
            : st.level === 'warn' ? 'Sudah lewat 80%. Unggah gambar akan diblokir otomatis di 95%. Sebaiknya mulai bersih-bersih.'
            : 'Aman. Kamu juga akan dapat email saat pemakaian melewati 80% dan 95%.'}
        </div>
      </div>

      <div className="eyebrow" style={{ marginTop: 6 }}>Thread dengan gambar terbanyak</div>
      {!st.topThreads.length && <div className="f-muted">Belum ada gambar di thread.</div>}
      {st.topThreads.map((t) => (
        <button key={t.id} type="button" className="f-storage-row" onClick={() => onOpenThread(t.id)}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.35 }}>
            <span className="f-name strong" style={{ fontSize: 14 }}>{t.title}</span>
            <span className="f-muted">{t.author} · {timeAgo(t.lastActivityAt)}</span>
          </span>
          <span style={{ flex: 'none', textAlign: 'right', lineHeight: 1.3 }}>
            <b style={{ display: 'block', fontSize: 14 }}>{fmtBytes(t.bytes)}</b>
            <span className="f-muted">{t.images} gambar</span>
          </span>
        </button>
      ))}
      {st.topThreads.length > 0 && <div className="form-note">Ketuk thread untuk membukanya, lalu hapus thread itu (gambarnya ikut terhapus).</div>}
      {st.unpostedImages > 0 && <div className="form-note">{st.unpostedImages} gambar ({fmtBytes(st.unpostedBytes)}) diunggah tapi belum diposting; terhapus otomatis setelah 1 hari.</div>}

      <div className="eyebrow" style={{ marginTop: 6 }}>Hapus gambar lama</div>
      <div className="f-side-card">
        <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--soft)' }}>Hapus semua gambar yang diunggah lebih dari:</div>
        <div className="f-chips-wrap">
          {[3, 6, 12].map((m) => (
            <button key={m} type="button" className={'f-chip' + (months === m ? ' on' : '')} aria-pressed={months === m} onClick={() => setMonths(m)}>{m} bulan</button>
          ))}
        </div>
        {preview ? (
          preview.count ? (
            <>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}><b>{preview.count} gambar</b> ({fmtBytes(preview.bytes)}) akan dihapus. Thread dan komentarnya tetap ada, hanya gambarnya yang hilang.</div>
              <button type="button" className="f-btn-ghost danger" onClick={() => setConfirm(true)}>Hapus {preview.count} gambar</button>
            </>
          ) : <div className="f-muted">Tidak ada gambar yang lebih tua dari {months} bulan.</div>
        ) : (
          <button type="button" className="f-btn-ghost" onClick={check}>Cek dulu berapa yang terhapus</button>
        )}
      </div>
      {confirm && <ConfirmSheet title={`Hapus ${preview.count} gambar?`} danger confirmLabel="Hapus gambar"
        text={`Semua gambar yang lebih tua dari ${months} bulan (${fmtBytes(preview.bytes)}) akan hilang dari forum untuk semua orang. Ini tidak bisa dibatalkan.`}
        onCancel={() => setConfirm(null)} onConfirm={run} />}
    </div>
  );
}

// Khusus admin: penyimpanan gambar, tambah / cabut moderator, dan aktifkan lagi pengguna yang dibisukan.
export default function Moderators({ desktop, onBack, onOpenThread, showToast, onAuthError }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const fail = useCallback((err) => { if (err instanceof AuthError) onAuthError(); showToast(err.message); }, [onAuthError, showToast]);
  const load = useCallback(async () => {
    try { setData(await apiGet('/forum/moderators')); setError(null); } catch (err) { if (err instanceof AuthError) onAuthError(); setError(err.message); }
  }, [onAuthError]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    let alive = true;
    const t = setTimeout(() => {
      apiGet('/forum/moderator-candidates?q=' + encodeURIComponent(q.trim()))
        .then((d) => alive && setFound(d.items)).catch(() => alive && setFound([]));
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [q, data]);

  const setMod = (p, action) => setConfirm({
    title: action === 'add' ? `Jadikan ${p.name} moderator?` : `Cabut moderator ${p.name}?`,
    text: action === 'add'
      ? 'Ia akan bisa menghapus komentar dan thread, menyematkan, mengunci, dan membisukan pengguna di forum.'
      : 'Ia kembali menjadi student biasa di forum.',
    label: action === 'add' ? 'Jadikan moderator' : 'Cabut', danger: action !== 'add',
    run: async () => {
      try {
        await apiPost('/forum/moderators', { studentId: p.studentId, action });
        showToast(action === 'add' ? `${p.name} sekarang moderator` : `Moderator ${p.name} dicabut`);
        setConfirm(null); setQ(''); load();
      } catch (err) { fail(err); }
    }
  });

  const unmute = async (p) => {
    try { await apiPost('/forum/mute', { studentId: p.studentId, muted: false }); showToast(`${p.name} bisa menulis lagi`); load(); } catch (err) { fail(err); }
  };

  const sub = (p) => 'ID ' + p.studentId + (p.batch ? ' · ' + p.batch : '');
  const content = (
    <div className="f-form">
      <Storage onOpenThread={onOpenThread} showToast={showToast} fail={fail} />
      <div className="f-sub" style={{ marginTop: 8 }}>Moderator bisa menghapus komentar dan thread, menyematkan, mengunci, dan membisukan pengguna. Hanya admin yang bisa menambah atau mencabut moderator.</div>
      {!data && (error ? <ErrorBox msg={'Gagal memuat: ' + error} onRetry={load} /> : <div className="loading"><span className="spinner" />Memuat…</div>)}
      {data && (
        <>
          <div className="f-section">
            <div className="eyebrow">Moderator saat ini · {data.admins.length + data.moderators.length}</div>
            {data.admins.map((p) => <Person key={p.studentId} p={p} sub="Admin · tidak bisa dicabut" action={<span className="f-badge f-badge-admin">ADMIN</span>} />)}
            {data.moderators.map((p) => <Person key={p.studentId} p={p} sub={sub(p)} action={<button type="button" className="f-pillbtn red" onClick={() => setMod(p, 'remove')}>Cabut</button>} />)}
          </div>
          <div className="f-section">
            <div className="eyebrow">Tambah moderator</div>
            <label className="search f-search">
              <Search />
              <input type="search" placeholder="Cari nama atau Student ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari student" />
            </label>
            {found.map((p) => <Person key={p.studentId} p={p} sub={sub(p)} action={<button type="button" className="f-pillbtn teal" onClick={() => setMod(p, 'add')}>Jadikan moderator</button>} />)}
            {q.trim().length >= 2 && !found.length && <div className="f-muted">Tidak ada student aktif yang cocok.</div>}
          </div>
          {data.muted.length > 0 && (
            <div className="f-section">
              <div className="eyebrow">Sedang dibisukan · {data.muted.length}</div>
              {data.muted.map((p) => <Person key={p.studentId} p={p} sub={sub(p)} action={<button type="button" className="f-pillbtn teal" onClick={() => unmute(p)}>Aktifkan</button>} />)}
            </div>
          )}
          <div className="form-note">Perubahan langsung berlaku. Setiap penambahan, pencabutan, dan pembisuan dicatat.</div>
        </>
      )}
      {confirm && <ConfirmSheet title={confirm.title} text={confirm.text} confirmLabel={confirm.label} danger={confirm.danger} onCancel={() => setConfirm(null)} onConfirm={confirm.run} />}
    </div>
  );

  if (desktop) {
    return (
      <div className="f-desk-thread">
        <button type="button" className="f-back-link" onClick={onBack}><ArrowLeft width={16} height={16} />Forum</button>
        <div className="f-desk-card" style={{ maxWidth: 760 }}>
          <h1 className="f-thread-title">Kelola forum</h1>
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="overlay f-overlay" style={{ zIndex: 6 }} role="dialog" aria-label="Kelola forum">
      <div className="overlay-head">
        <button className="icon-btn lg" aria-label="Kembali ke Forum" onClick={onBack}><ArrowLeft /></button>
        <span className="syne nowrap" style={{ fontWeight: 700, fontSize: 17, marginRight: 'auto' }}>Kelola forum</span>
        <span className="f-badge f-badge-admin">KHUSUS ADMIN</span>
      </div>
      <div className="f-overlay-body noscroll" style={{ padding: '0 20px 24px' }}>{content}</div>
    </div>
  );
}
