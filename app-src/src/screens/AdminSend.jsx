import { useState } from 'react';
import { apiPost } from '../api.js';
import ConfirmSheet from './ConfirmSheet.jsx';
import { ErrorBox } from './Today.jsx';

const LIMIT = { title: 150, body: 5000 };

export default function AdminSend({ meta, showToast }) {
  const [batch, setBatch] = useState('');
  const [kind, setKind] = useState('Pengumuman');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [sendErr, setSendErr] = useState('');

  const batches = meta.data?.batches || [];
  const kinds = meta.data?.kinds || ['Pengumuman'];
  const cur = batches.find((b) => b.batch === batch);

  const validate = () => {
    const e = {};
    if (!batch) e.batch = 'Pilih batch tujuan.';
    if (!title.trim()) e.title = 'Judul wajib diisi.';
    else if (title.length > LIMIT.title) e.title = `Maksimal ${LIMIT.title} karakter.`;
    if (!body.trim()) e.body = 'Isi pesan wajib diisi.';
    else if (body.length > LIMIT.body) e.body = `Maksimal ${LIMIT.body} karakter.`;
    if (linkUrl.trim() && !/^https:\/\/\S+$/i.test(linkUrl.trim())) e.linkUrl = 'Link harus diawali https://';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const ask = () => { setSendErr(''); if (validate()) setConfirm(true); };

  const send = async () => {
    try {
      const r = await apiPost('/admin/notifications', { batch, kind, title: title.trim(), body, linkName: linkName.trim(), linkUrl: linkUrl.trim() });
      setConfirm(false);
      setTitle(''); setBody(''); setLinkName(''); setLinkUrl(''); setErrors({});
      showToast(`Terkirim ke ${r.recipients} student Batch ${r.batch}`);
    } catch (err) {
      setConfirm(false);
      setSendErr(err.message);
    }
  };

  const err = (k) => errors[k] && <div className="field-err">{errors[k]}</div>;

  return (
    <div className="screen">
      <div>
        <div className="sub">Khusus admin</div>
        <h1 className="h1">Kirim Pesan</h1>
        <div className="form-note" style={{ marginTop: 6 }}>Pesan langsung muncul di menu Notifikasi semua student aktif pada batch yang dipilih.</div>
      </div>

      {meta.loading && !meta.data && <div className="loading"><span className="spinner" />Memuat daftar batch…</div>}
      {meta.error && !meta.data && <ErrorBox msg={'Gagal memuat batch: ' + meta.error} onRetry={meta.reload} />}

      {meta.data && (
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="f-batch" className="label" style={{ marginBottom: 8 }}>Batch tujuan</label>
            <select id="f-batch" className={'field' + (errors.batch ? ' err' : '')} value={batch} onChange={(e) => { setBatch(e.target.value); setErrors({ ...errors, batch: null }); }}>
              <option value="">Pilih batch…</option>
              {batches.map((b) => <option key={b.batch} value={b.batch}>Batch {b.batch} · {b.students} student aktif</option>)}
            </select>
            {err('batch')}
          </div>

          <div>
            <label htmlFor="f-kind" className="label" style={{ marginBottom: 8 }}>Kategori</label>
            <select id="f-kind" className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
              {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="f-title" className="label" style={{ marginBottom: 8 }}>Judul</label>
            <input id="f-title" className={'field' + (errors.title ? ' err' : '')} maxLength={LIMIT.title + 20} placeholder="Contoh: Morning Updates!!" value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: null }); }} />
            {err('title')}
          </div>

          <div>
            <label htmlFor="f-body" className="label" style={{ marginBottom: 8 }}>Pesan</label>
            <textarea id="f-body" className={'field area' + (errors.body ? ' err' : '')} placeholder="Tulis pesan untuk student…" value={body}
              onChange={(e) => { setBody(e.target.value); setErrors({ ...errors, body: null }); }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>{err('body')}</div>
              <div className="form-note" style={{ marginTop: 6, flex: 'none' }}>{body.length}/{LIMIT.body}</div>
            </div>
            <div className="form-note" style={{ marginTop: 4 }}>Baris kosong = paragraf baru.</div>
          </div>

          <div>
            <label htmlFor="f-lurl" className="label" style={{ marginBottom: 8 }}>Link (opsional)</label>
            <input id="f-lurl" className={'field' + (errors.linkUrl ? ' err' : '')} inputMode="url" autoCapitalize="none" placeholder="https://…" value={linkUrl}
              onChange={(e) => { setLinkUrl(e.target.value); setErrors({ ...errors, linkUrl: null }); }} />
            {err('linkUrl')}
            {linkUrl.trim() && (
              <input className="field" style={{ marginTop: 8 }} placeholder="Nama link, mis. Buka Google Form" value={linkName} onChange={(e) => setLinkName(e.target.value)} aria-label="Nama link" />
            )}
          </div>

          <div className="form-note">Pengirim: <b style={{ color: '#e2e6f0' }}>Richard · Student Advisor</b></div>
          {sendErr && <div role="alert" style={{ padding: '11px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>Gagal mengirim: {sendErr}</div>}
          <button type="submit" className="primary-btn">Kirim ke student</button>
        </form>
      )}

      {confirm && (
        <ConfirmSheet title={`Kirim ke Batch ${batch}?`}
          text={`Pesan "${title.trim()}" akan langsung muncul untuk ${cur ? cur.students + ' student aktif' : 'semua student aktif'} di Batch ${batch}. Setelah terkirim, pesan bisa dihapus lewat menu Terkirim.`}
          confirmLabel="Kirim sekarang" onCancel={() => setConfirm(false)} onConfirm={send} />
      )}
    </div>
  );
}
