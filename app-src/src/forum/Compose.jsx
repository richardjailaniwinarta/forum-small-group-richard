import { useState } from 'react';
import { apiPost, AuthError } from '../api.js';
import { ArrowLeft } from '../components/Icons.jsx';
import Editor from './Editor.jsx';
import { AddImageButton, ImageThumbs, useImagePicker } from './images.jsx';
import { CATEGORIES, CatDot, LIMIT, STAFF_ONLY, UPLOAD_BLOCKED_MSG } from './shared.jsx';

// Buat thread baru, atau edit thread sendiri (edit = teks & kategori; gambar tidak diubah).
export default function Compose({ desktop, me, edit, onCancel, onDone, showToast, onAuthError }) {
  const [category, setCategory] = useState(edit ? edit.category : 'Diskusi');
  const [title, setTitle] = useState(edit ? edit.title : '');
  const [body, setBody] = useState(edit ? edit.body : '');
  const [pinned, setPinned] = useState(false);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const picker = useImagePicker({ showToast, onAuthError });
  const isMod = me && me.isMod;
  const cats = CATEGORIES.filter((c) => isMod || !STAFF_ONLY.includes(c) || (edit && edit.category === c));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!title.trim()) er.title = 'Judul wajib diisi.';
    else if (title.trim().length > LIMIT.title) er.title = `Maksimal ${LIMIT.title} karakter.`;
    if (!body.trim()) er.body = 'Isi thread wajib diisi.';
    else if (body.length > LIMIT.threadBody) er.body = `Maksimal ${LIMIT.threadBody} karakter.`;
    setErrors(er);
    if (Object.keys(er).length || picker.busy) return;
    setSending(true);
    try {
      const r = edit
        ? await apiPost(`/forum/threads/${edit.id}/edit`, { category, title, body })
        : await apiPost('/forum/threads', { category, title, body, imageIds: picker.ids, pinned: isMod && pinned, locked: isMod && locked });
      showToast(edit ? 'Thread disimpan' : 'Thread diposting');
      onDone(r.id);
    } catch (err) {
      if (err instanceof AuthError) onAuthError();
      showToast(err.message);
    } finally {
      setSending(false);
    }
  };

  const form = (
    <form id="f-compose" onSubmit={submit} noValidate className="f-form">
      <div>
        <div className="label" style={{ marginBottom: 8 }}>Kategori</div>
        <div className="f-chips-wrap">
          {cats.map((c) => (
            <button key={c} type="button" className={'f-chip' + (category === c ? ' on' : '')} aria-pressed={category === c} onClick={() => setCategory(c)}>
              <CatDot cat={c} />{c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="f-title" className="label" style={{ marginBottom: 8 }}>Judul</label>
        <input id="f-title" className={'field' + (errors.title ? ' err' : '')} placeholder="Tulis judul yang jelas" value={title}
          maxLength={LIMIT.title + 20} onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: null }); }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>{errors.title && <div className="field-err">{errors.title}</div>}</div>
          <div className="form-note" style={{ marginTop: 6 }}>{title.length}/{LIMIT.title}</div>
        </div>
      </div>
      <div>
        <label htmlFor="f-body" className="label" style={{ marginBottom: 8 }}>Isi thread</label>
        <Editor id="f-body" value={body} max={LIMIT.threadBody} error={errors.body}
          placeholder="Ceritakan pertanyaan atau topikmu. Pakai tombol di atas untuk tebal, poin, link, dan emoji."
          onChange={(v) => { setBody(v); setErrors((er) => ({ ...er, body: null })); }} />
        {errors.body && <div className="field-err">{errors.body}</div>}
      </div>
      {!edit ? (
        <div>
          {picker.input}
          <AddImageButton picker={picker} label="Tambah gambar (maks 5, otomatis dikecilkan)" blocked={me && me.uploadsBlocked} />
          {me && me.uploadsBlocked && <div className="f-blocked-note">{UPLOAD_BLOCKED_MSG}.{me.isAdmin ? ' Penyimpanan gambar sudah 95%: buka Kelola forum untuk membersihkan.' : ' Kamu tetap bisa memposting tanpa gambar.'}</div>}
          <ImageThumbs picker={picker} />
        </div>
      ) : (
        <div className="form-note">Gambar tidak bisa diubah saat mengedit. Hapus thread dan buat ulang kalau perlu mengganti gambar.</div>
      )}
      <div className="f-banner blue">Nama lengkap dan batch kamu akan tampil di thread ini dan terlihat oleh semua student.</div>
      {isMod && !edit && (
        <div className="f-staff-box">
          <div className="f-eyebrow">Khusus admin dan moderator</div>
          <label className="f-toggle"><span>Sematkan di paling atas</span><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /></label>
          <label className="f-toggle"><span>Kunci komentar</span><input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} /></label>
        </div>
      )}
    </form>
  );

  const submitBtn = (
    <button type="submit" form="f-compose" className="primary-btn" disabled={sending || picker.busy}>
      {sending && <span className="spinner" />}
      {picker.busy ? 'Menunggu gambar selesai diunggah…' : sending ? 'Menyimpan…' : edit ? 'Simpan perubahan' : 'Posting thread'}
    </button>
  );

  if (desktop) {
    return (
      <div className="f-desk-thread">
        <button type="button" className="f-back-link" onClick={onCancel}><ArrowLeft width={16} height={16} />Kembali</button>
        <div className="f-desk-card" style={{ maxWidth: 920 }}>
          <h1 className="f-thread-title">{edit ? 'Edit thread' : 'Thread baru'}</h1>
          {form}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="f-btn-ghost" onClick={onCancel}>Batal</button>
            <div style={{ minWidth: 240 }}>{submitBtn}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay f-overlay" style={{ zIndex: 6 }} role="dialog" aria-label={edit ? 'Edit thread' : 'Thread baru'}>
      <div className="overlay-head">
        <button className="icon-btn lg" aria-label="Batal" onClick={onCancel}><ArrowLeft /></button>
        <span className="syne nowrap" style={{ fontWeight: 700, fontSize: 17, marginRight: 'auto' }}>{edit ? 'Edit thread' : 'Thread baru'}</span>
      </div>
      <div className="f-overlay-body noscroll" style={{ padding: '0 20px 20px' }}>{form}</div>
      <div className="f-footer">{submitBtn}</div>
    </div>
  );
}
