import { useEffect, useRef, useState } from 'react';
import { apiGet, AuthError } from '../api.js';
import { Comment, ImageIcon, Lock, Pin, Plus, Search, Shield } from '../components/Icons.jsx';
import { ErrorBox } from '../screens/Today.jsx';
import { Avatar, Badges, CATEGORIES, CatDot, CatPill, timeAgo } from './shared.jsx';

function ThreadCard({ t, desktop, onOpen }) {
  const meta = (
    <span className="f-meta-row">
      <span className="f-name">{t.author.name}</span>
      <Badges author={t.author} />
      {desktop && <span className="f-muted">{timeAgo(t.lastActivityAt)}</span>}
    </span>
  );
  const flags = (
    <span className="f-flags">
      {t.pinned && <span className="f-flag gold"><Pin />Disematkan</span>}
      {t.locked && <span className="f-flag"><Lock />Dikunci</span>}
      {t.imageCount > 0 && <span className="f-flag"><ImageIcon width={13} height={13} />{t.imageCount}</span>}
    </span>
  );
  if (desktop) {
    return (
      <button type="button" className={'f-row' + (t.pinned ? ' pinned' : '')} onClick={() => onOpen(t.id)}>
        <Avatar name={t.author.name} size={42} />
        <span className="f-row-main">
          <span className="f-row-top"><CatPill cat={t.category} />{flags}</span>
          <span className="f-row-title">{t.title}</span>
          {meta}
        </span>
        <span className="f-row-count"><b>{t.commentCount}</b><span>komentar</span></span>
      </button>
    );
  }
  return (
    <button type="button" className={'f-card' + (t.pinned ? ' pinned' : '')} onClick={() => onOpen(t.id)}>
      <span className="f-card-top"><CatPill cat={t.category} /><span className="f-muted">{timeAgo(t.lastActivityAt)}</span></span>
      {(t.pinned || t.locked || t.imageCount > 0) && flags}
      <span className="f-card-title">{t.title}</span>
      <span className="f-card-foot">
        <Avatar name={t.author.name} size={24} />
        {meta}
        <span className="f-count"><Comment />{t.commentCount}</span>
      </span>
    </button>
  );
}

export default function ThreadList({ desktop, nonce, onOpen, onCompose, onMods, onMe, onAuthError }) {
  const [category, setCategory] = useState('');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [state, setState] = useState({ items: [], page: 1, hasMore: false, loading: true, error: null, me: null });
  const req = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = async (page) => {
    const my = ++req.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    try {
      const d = await apiGet('/forum/threads?' + params);
      if (my !== req.current) return;
      onMe(d.me);
      setState((s) => ({ items: page === 1 ? d.items : [...s.items, ...d.items], page, hasMore: d.hasMore, loading: false, error: null, me: d.me }));
    } catch (err) {
      if (my !== req.current) return;
      if (err instanceof AuthError) onAuthError();
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1); }, [category, q, nonce]);

  const me = state.me;
  const chips = (
    <div className={desktop ? 'f-chips-wrap' : 'chips noscroll'}>
      {['', ...CATEGORIES].map((c) => (
        <button key={c || 'all'} type="button" className={'f-chip' + (category === c ? ' on' : '')} aria-pressed={category === c} onClick={() => setCategory(c)}>
          {c && <CatDot cat={c} />}{c || 'Semua'}
        </button>
      ))}
    </div>
  );
  const search = (
    <label className="search f-search">
      <Search />
      <input type="search" placeholder="Cari thread…" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Cari thread" />
    </label>
  );
  const list = (
    <div className="f-list">
      {me && me.storage && me.storage.level !== 'ok' && (
        <button type="button" className={'f-banner f-banner-btn ' + (me.storage.level === 'block' ? 'red' : 'gold')} onClick={onMods}>
          {me.storage.level === 'block'
            ? `Penyimpanan gambar forum sudah ${String(me.storage.percent).replace('.', ',')}%. Unggah gambar diblokir untuk semua.`
            : `Penyimpanan gambar forum sudah ${String(me.storage.percent).replace('.', ',')}%. Unggah akan diblokir di 95%.`}
          <b> Buka Kelola forum →</b>
        </button>
      )}
      {me && me.muted && <div className="f-banner red">Kamu sedang dibisukan oleh moderator. Kamu tetap bisa membaca, tapi belum bisa menulis.</div>}
      {state.loading && !state.items.length && <div className="loading"><span className="spinner" />Memuat forum…</div>}
      {state.error && !state.items.length && <ErrorBox msg={'Gagal memuat forum: ' + state.error} onRetry={() => load(1)} />}
      {state.items.map((t) => <ThreadCard key={t.id} t={t} desktop={desktop} onOpen={onOpen} />)}
      {!state.loading && !state.error && !state.items.length && (
        <div className="empty">{q || category ? 'Tidak ada thread yang cocok.' : 'Belum ada thread. Jadilah yang pertama!'}</div>
      )}
      {state.hasMore && (
        <button type="button" className="f-btn-ghost" disabled={state.loading} onClick={() => load(state.page + 1)}>
          {state.loading ? 'Memuat…' : 'Muat lebih banyak'}
        </button>
      )}
    </div>
  );
  const head = (
    <div>
      <div className="f-eyebrow">Komunitas Small Group Richard</div>
      <h1 className={desktop ? 'f-h1-desk' : 'h1'}>Forum</h1>
      <div className="f-sub">Tanya, berbagi, dan ngobrol bareng semua student dari semua batch.</div>
    </div>
  );

  if (desktop) {
    return (
      <div className="f-desk-cols">
        <div className="f-desk-main">
          <div className="f-desk-head">
            {head}
            <button type="button" className="f-btn" onClick={onCompose} disabled={!me || me.muted}><Plus />Thread baru</button>
          </div>
          <div className="f-desk-filters">{search}{chips}</div>
          {list}
        </div>
        <aside className="f-desk-side">
          <div className="f-side-card">
            <div className="f-side-title">Aturan singkat</div>
            <ol className="f-rules">
              <li>Saling menghormati. Tidak ada hinaan atau ujaran kebencian.</li>
              <li>Jangan bagikan info bonus atau data pribadi (nomor HP, email, akun klien).</li>
              <li>Pakai kategori yang pas dan judul yang jelas.</li>
            </ol>
          </div>
          {me && me.isAdmin && (
            <div className="f-side-card">
              <div className="f-side-title">Admin</div>
              <button type="button" className="f-btn-ghost" onClick={onMods}><Shield width={16} height={16} />Kelola forum</button>
            </div>
          )}
        </aside>
      </div>
    );
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        {head}
        {me && me.isAdmin && (
          <button type="button" className="icon-btn" aria-label="Kelola forum" onClick={onMods} style={{ marginTop: 4 }}><Shield /></button>
        )}
      </div>
      {search}
      {chips}
      {list}
      <div style={{ height: 56 }} />
      {me && !me.muted && (
        <button type="button" className="f-fab" onClick={onCompose}><Plus />Thread baru</button>
      )}
    </div>
  );
}
