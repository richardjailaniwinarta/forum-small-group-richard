import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost, AuthError } from '../api.js';
import { ArrowLeft, Ban, Edit, Lock, More, Pin, Send, Trash } from '../components/Icons.jsx';
import ConfirmSheet from '../screens/ConfirmSheet.jsx';
import { ErrorBox } from '../screens/Today.jsx';
import { EmojiButton, insertAtCursor } from './Editor.jsx';
import { AddImageButton, ImageThumbs, useImagePicker } from './images.jsx';
import { ActionSheet, Avatar, Badges, CatPill, ImageGrid, LIMIT, Lightbox, RichText, timeAgo, UPLOAD_BLOCKED_MSG } from './shared.jsx';

function AuthorLine({ author, time, edited, size = 36 }) {
  return (
    <div className="f-author">
      <Avatar name={author.name} size={size} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, minWidth: 0 }}>
        <span className="f-meta-row"><span className="f-name strong">{author.name}</span><Badges author={author} /></span>
        <span className="f-muted">{timeAgo(time)}{edited ? ' · diedit' : ''}</span>
      </span>
    </div>
  );
}

function CommentBox({ threadId, disabledReason, uploadsBlocked, onPosted, showToast, onAuthError, desktop }) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const picker = useImagePicker({ showToast, onAuthError });
  const ta = useRef(null);
  if (disabledReason) return <div className={'f-banner' + (desktop ? '' : ' f-composer-banner')}>{disabledReason}</div>;
  const canSend = (body.trim() || picker.ids.length) && !picker.busy && !sending && body.length <= LIMIT.comment;
  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await apiPost(`/forum/threads/${threadId}/comments`, { body, imageIds: picker.ids });
      setBody('');
      picker.reset();
      onPosted();
    } catch (err) {
      if (err instanceof AuthError) onAuthError();
      showToast(err.message);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className={desktop ? 'f-composer-desk' : 'f-composer'}>
      {picker.input}
      <ImageThumbs picker={picker} />
      <div className="f-composer-row">
        <AddImageButton picker={picker} blocked={uploadsBlocked} />
        <EmojiButton className="f-emoji-btn" onPick={(em) => insertAtCursor(ta.current, body, setBody, em)} />
        <textarea ref={ta} className="f-textarea" rows={desktop ? 3 : 1} placeholder="Tulis komentar…" aria-label="Tulis komentar" value={body}
          maxLength={LIMIT.comment + 200} onChange={(e) => setBody(e.target.value)} />
        <button type="button" className="f-send" aria-label="Kirim komentar" disabled={!canSend} onClick={send}>
          {sending ? <span className="spinner" /> : <Send />}
        </button>
      </div>
      {uploadsBlocked && <div className="f-blocked-note">{UPLOAD_BLOCKED_MSG}. Komentar teks tetap bisa dikirim.</div>}
      {body.length > LIMIT.comment - 200 && <div className="f-counter">{body.length}/{LIMIT.comment}</div>}
    </div>
  );
}

export default function ThreadView({ id, desktop, onBack, onEdit, onDeleted, showToast, onAuthError }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null);     // { title, subtitle, actions }
  const [confirm, setConfirm] = useState(null); // { title, text, label, run, danger }
  const [editing, setEditing] = useState(null); // { id, body }
  const [lightbox, setLightbox] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await apiGet('/forum/threads/' + id));
      setError(null);
    } catch (err) {
      if (err instanceof AuthError) onAuthError();
      setError(err.message);
    }
  }, [id, onAuthError]);
  useEffect(() => { load(); }, [load]);

  const act = async (path, body, okMsg) => {
    try {
      await apiPost(path, body || {});
      if (okMsg) showToast(okMsg);
      return true;
    } catch (err) {
      if (err instanceof AuthError) onAuthError();
      showToast(err.message);
      return false;
    }
  };

  const t = data && data.thread;
  const me = data && data.me;

  const threadActions = () => {
    const a = [];
    if (t.canEdit) a.push({ label: 'Edit thread', icon: <Edit />, run: () => { setSheet(null); onEdit(t); } });
    if (me.isMod) {
      a.push({ label: t.pinned ? 'Lepas sematan' : 'Sematkan thread', desc: t.pinned ? 'Kembali ke urutan biasa' : 'Tampil paling atas di daftar', icon: <Pin />,
        run: async () => { setSheet(null); if (await act(`/forum/threads/${id}/moderate`, { pinned: !t.pinned }, t.pinned ? 'Sematan dilepas' : 'Thread disematkan')) load(); } });
      a.push({ label: t.locked ? 'Buka kunci' : 'Kunci thread', desc: t.locked ? 'Komentar baru bisa ditambahkan lagi' : 'Tidak ada komentar baru, isi tetap bisa dibaca', icon: <Lock />,
        run: async () => { setSheet(null); if (await act(`/forum/threads/${id}/moderate`, { locked: !t.locked }, t.locked ? 'Kunci dibuka' : 'Thread dikunci')) load(); } });
      if (!t.author.mine && !t.author.badge) a.push(muteAction({ threadId: id }, t.author.name));
    }
    if (t.canDelete) a.push({ label: 'Hapus thread', desc: 'Beserta semua komentar dan gambarnya', icon: <Trash width={16} height={16} />, danger: true,
      run: () => { setSheet(null); setConfirm({ title: 'Hapus thread ini?', text: `"${t.title}" dan semua komentarnya akan hilang untuk semua orang. Ini tidak bisa dibatalkan.`, label: 'Hapus', danger: true,
        run: async () => { if (await act(`/forum/threads/${id}/delete`, null, 'Thread dihapus')) { setConfirm(null); onDeleted(); } } }); } });
    return a;
  };

  const muteAction = (target, name) => ({
    label: 'Bisukan penulis', desc: `${name} tidak bisa menulis sampai diaktifkan lagi`, icon: <Ban />, danger: true,
    run: () => { setSheet(null); setConfirm({ title: `Bisukan ${name}?`, text: 'Ia tetap bisa membaca forum, tapi tidak bisa membuat thread, berkomentar, atau mengunggah gambar. Admin bisa mengaktifkannya lagi di Kelola forum.', label: 'Bisukan', danger: true,
      run: async () => { if (await act('/forum/mute', { ...target, muted: true }, `${name} dibisukan`)) setConfirm(null); } }); }
  });

  const commentActions = (c) => {
    const a = [];
    if (c.canEdit) a.push({ label: 'Edit komentar', icon: <Edit />, run: () => { setSheet(null); setEditing({ id: c.id, body: c.body }); } });
    if (me.isMod && !c.author.mine && !c.author.badge) a.push(muteAction({ commentId: c.id }, c.author.name));
    if (c.canDelete) a.push({ label: 'Hapus komentar', desc: 'Hilang dari thread untuk semua orang', icon: <Trash width={16} height={16} />, danger: true,
      run: () => { setSheet(null); setConfirm({ title: 'Hapus komentar ini?', text: 'Komentar dan gambarnya akan hilang untuk semua orang.', label: 'Hapus', danger: true,
        run: async () => { if (await act(`/forum/comments/${c.id}/delete`, null, 'Komentar dihapus')) { setConfirm(null); load(); } } }); } });
    return a;
  };

  const saveEdit = async () => {
    if (await act(`/forum/comments/${editing.id}/edit`, { body: editing.body }, 'Komentar disimpan')) { setEditing(null); load(); }
  };

  const disabledReason = !me ? null
    : me.muted ? 'Kamu sedang dibisukan oleh moderator, jadi belum bisa berkomentar.'
    : t.locked && !me.isMod ? 'Thread ini dikunci oleh moderator. Komentar baru tidak bisa ditambahkan.'
    : null;

  const content = !data ? (
    <div style={{ padding: desktop ? 0 : '0 20px' }}>
      {error ? <ErrorBox msg={'Gagal memuat thread: ' + error} onRetry={load} /> : <div className="loading"><span className="spinner" />Memuat thread…</div>}
    </div>
  ) : (
    <>
      <div className={desktop ? 'f-desk-card' : 'f-thread-head'}>
        <div className="f-flags"><CatPill cat={t.category} />{t.pinned && <span className="f-flag gold"><Pin />Disematkan</span>}{t.locked && <span className="f-flag"><Lock />Dikunci</span>}</div>
        <h1 className="f-thread-title">{t.title}</h1>
        <div className="f-divider"><AuthorLine author={t.author} time={t.createdAt} edited={t.editedAt} size={desktop ? 42 : 36} /></div>
        <RichText text={t.body} />
        <ImageGrid images={t.images} onOpen={(imgs, i) => setLightbox({ imgs, i })} />
      </div>
      <h2 className="f-h2">{data.comments.length} komentar</h2>
      <div className="f-comments">
        {data.comments.map((c) => (
          <div key={c.id} className="f-comment">
            <Avatar name={c.author.name} size={desktop ? 38 : 32} />
            <div className={'f-bubble' + (c.author.badge === 'admin' ? ' admin' : c.author.badge === 'moderator' ? ' mod' : '')}>
              <div className="f-bubble-head">
                <div className="f-meta-row">
                  <span className="f-name strong">{c.author.name}</span><Badges author={c.author} />
                  <span className="f-muted">{timeAgo(c.createdAt)}{c.editedAt ? ' · diedit' : ''}</span>
                </div>
                {(c.canEdit || c.canDelete || me.isMod) && commentActions(c).length > 0 && (
                  <button type="button" className="f-more" aria-label="Tindakan komentar"
                    onClick={() => setSheet({ title: 'Tindakan komentar', subtitle: 'Komentar dari ' + c.author.name + (c.author.batch ? ' · ' + c.author.batch : ''), actions: commentActions(c) })}><More /></button>
                )}
              </div>
              {editing && editing.id === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea className="f-textarea boxed" rows={3} value={editing.body} aria-label="Edit komentar" onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="f-btn-ghost small" onClick={() => setEditing(null)}>Batal</button>
                    <button type="button" className="f-btn small" onClick={saveEdit}>Simpan</button>
                  </div>
                </div>
              ) : (
                c.body && <RichText text={c.body} size={14} />
              )}
              <ImageGrid images={c.images} onOpen={(imgs, i) => setLightbox({ imgs, i })} />
            </div>
          </div>
        ))}
        {!data.comments.length && <div className="empty">Belum ada komentar. Tulis yang pertama!</div>}
      </div>
      {desktop && <CommentBox desktop threadId={id} disabledReason={disabledReason} uploadsBlocked={me.uploadsBlocked} onPosted={load} showToast={showToast} onAuthError={onAuthError} />}
    </>
  );

  const overlays = (
    <>
      {sheet && <ActionSheet {...sheet} onClose={() => setSheet(null)} />}
      {confirm && <ConfirmSheet title={confirm.title} text={confirm.text} confirmLabel={confirm.label} danger={confirm.danger} onCancel={() => setConfirm(null)} onConfirm={confirm.run} />}
      {lightbox && <Lightbox images={lightbox.imgs} index={lightbox.i} onClose={() => setLightbox(null)}
        onMove={(d) => setLightbox((l) => ({ ...l, i: Math.min(l.imgs.length - 1, Math.max(0, l.i + d)) }))} />}
    </>
  );

  if (desktop) {
    const staff = data && threadActions();
    return (
      <div className="f-desk-thread">
        <button type="button" className="f-back-link" onClick={onBack}><ArrowLeft width={16} height={16} />Forum{t ? ' / ' + t.category : ''}</button>
        <div className="f-desk-cols">
          <div className="f-desk-main">{content}</div>
          {data && (
            <aside className="f-desk-side">
              <div className="f-side-card">
                <div className="f-side-title">Tentang thread</div>
                <div className="f-kv"><span>Dibuat oleh</span><b>{t.author.name}{t.author.batch ? ' · ' + t.author.batch : ''}</b></div>
                <div className="f-kv"><span>Kategori</span><b>{t.category}</b></div>
                <div className="f-kv"><span>Komentar</span><b>{data.comments.length}</b></div>
                <div className="f-kv"><span>Status</span><b style={{ color: t.locked ? '#f87171' : '#2fd0a3' }}>{t.locked ? 'Dikunci' : 'Terbuka'}</b></div>
              </div>
              {staff.length > 0 && (
                <div className="f-side-card">
                  <div className="f-side-title">{me.isMod ? 'Tindakan' : 'Thread kamu'}</div>
                  {staff.map((a) => (
                    <button key={a.label} type="button" className={'f-btn-ghost' + (a.danger ? ' danger' : '')} onClick={a.run}>{a.icon}{a.label}</button>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
        {overlays}
      </div>
    );
  }

  return (
    <div className="overlay f-overlay" role="dialog" aria-label="Thread">
      <div className="overlay-head">
        <button className="icon-btn lg" aria-label="Kembali ke Forum" onClick={onBack}><ArrowLeft /></button>
        <span className="syne nowrap" style={{ fontWeight: 700, fontSize: 17, marginRight: 'auto' }}>Thread</span>
        {data && threadActions().length > 0 && (
          <button className="icon-btn" aria-label="Tindakan thread" onClick={() => setSheet({ title: me.isMod ? 'Tindakan moderator' : 'Thread kamu', subtitle: t.title, actions: threadActions() })}><More /></button>
        )}
      </div>
      <div className="f-overlay-body noscroll">{content}</div>
      {data && <CommentBox threadId={id} disabledReason={disabledReason} uploadsBlocked={me.uploadsBlocked} onPosted={load} showToast={showToast} onAuthError={onAuthError} />}
      {overlays}
    </div>
  );
}
