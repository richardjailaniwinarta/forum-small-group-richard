import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../api.js';
import Compose from './Compose.jsx';
import Moderators from './Moderators.jsx';
import ThreadList from './ThreadList.jsx';
import ThreadView from './ThreadView.jsx';
import './forum.css';

// Di laptop alamat halaman ikut berubah (#thread-12), jadi tombol Back browser dan link thread berfungsi.
const fromHash = () => {
  const h = window.location.hash;
  let m = h.match(/^#thread-(\d+)$/);
  if (m) return { name: 'thread', id: Number(m[1]) };
  if (h === '#baru') return { name: 'compose' };
  if (h === '#moderator') return { name: 'mods' };
  return { name: 'list' };
};
const toHash = (v) => (v.name === 'thread' ? '#thread-' + v.id : v.name === 'compose' && !v.edit ? '#baru' : v.name === 'mods' ? '#moderator' : '');

export default function ForumApp({ desktop, showToast, onAuthError }) {
  const [view, setViewState] = useState(() => (desktop ? fromHash() : { name: 'list' }));
  const [nonce, setNonce] = useState(0);
  const [me, setMe] = useState(null);

  // Status akun (admin/moderator, unggah diblokir) biasanya datang dari daftar thread.
  // Kalau halaman langsung dibuka di "Thread baru" (mis. /forum/#baru), ambil sendiri.
  useEffect(() => {
    if (me) return undefined;
    let alive = true;
    apiGet('/forum/threads').then((d) => { if (alive && d && d.me) setMe(d.me); }).catch(() => {});
    return () => { alive = false; };
  }, [me]);

  const setView = useCallback((v) => {
    setViewState(v);
    if (desktop) {
      const h = toHash(v);
      if (h !== window.location.hash) window.history.pushState(null, '', h || window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    }
  }, [desktop]);

  useEffect(() => {
    if (!desktop) return undefined;
    const sync = () => { setViewState(fromHash()); setNonce((n) => n + 1); };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [desktop]);

  const toList = () => { setView({ name: 'list' }); setNonce((n) => n + 1); };
  const common = { desktop, showToast, onAuthError };

  const list = (
    <ThreadList {...common} nonce={nonce} onMe={setMe}
      onOpen={(id) => setView({ name: 'thread', id })}
      onCompose={() => setView({ name: 'compose' })}
      onMods={() => setView({ name: 'mods' })} />
  );
  let panel = null;
  if (view.name === 'thread') {
    panel = <ThreadView key={view.id + ':' + nonce} {...common} id={view.id} onBack={toList}
      onEdit={(t) => setView({ name: 'compose', edit: t })} onDeleted={toList} />;
  } else if (view.name === 'compose') {
    panel = <Compose {...common} me={me} edit={view.edit}
      onCancel={() => (view.edit ? setView({ name: 'thread', id: view.edit.id }) : toList())}
      onDone={(id) => { setNonce((n) => n + 1); setView({ name: 'thread', id }); }} />;
  } else if (view.name === 'mods') {
    panel = <Moderators {...common} onBack={toList} onOpenThread={(id) => setView({ name: 'thread', id })} />;
  }

  if (desktop) return panel || list;
  return (
    <>
      {list}
      {panel}
    </>
  );
}
