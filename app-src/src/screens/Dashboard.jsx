import { useCallback, useEffect, useRef, useState } from 'react';
import { mapNotif } from '../lib/notifs.js';
import { useResource } from '../lib/useResource.js';
import { Bell, LogoutIcon, TabFolder, TabForum, TabSend, TabSent } from '../components/Icons.jsx';
import ForumApp from '../forum/ForumApp.jsx';
import Directory from './Directory.jsx';
import AdminSend from './AdminSend.jsx';
import AdminSent from './AdminSent.jsx';
import { NotifDetail, NotifList } from './Notifications.jsx';
import LogoutSheet from './LogoutSheet.jsx';

const READ_KEY = 'sgr_app_notifs_read';

function loadReadIds() {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
}

// Forum = menu utama. Hari Ini, Jadwal, dan Tracker sudah dihapus.
const STUDENT_TABS = [
  { key: 'forum', label: 'Forum', Icon: TabForum },
  { key: 'dir', label: 'Directory', Icon: TabFolder }
];
// Admin hanya melihat dua menu ini. Tampilan admin sengaja hanya ada di app /app/.
const ADMIN_TABS = [
  { key: 'send', label: 'Kirim Pesan', Icon: TabSend },
  { key: 'sent', label: 'Terkirim', Icon: TabSent },
  { key: 'forum', label: 'Forum', Icon: TabForum }
];

export default function Dashboard({ session, onLogout }) {
  const isAdmin = session.role === 'admin';
  const TABS = isAdmin ? ADMIN_TABS : STUDENT_TABS;
  const [tab, setTab] = useState(isAdmin ? 'send' : 'forum');
  const [visited, setVisited] = useState({ forum: true });
  const [readIds, setReadIds] = useState(loadReadIds);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifDetail, setNotifDetail] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const scrollRef = useRef();

  const dir = useResource('/directory', !isAdmin && !!visited.dir, onLogout);
  const notifRes = useResource('/me/notifications', !isAdmin, onLogout);
  const adminMeta = useResource('/admin/notification-batches', isAdmin, onLogout);

  const notifs = (notifRes.data?.items || []).map((r) => ({ ...mapNotif(r), read: readIds.includes(r.id) }));

  useEffect(() => {
    try { localStorage.setItem(READ_KEY, JSON.stringify(readIds.slice(-500))); } catch { /* abaikan */ }
  }, [readIds]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const go = (k) => {
    setTab(k);
    setVisited((v) => ({ ...v, [k]: true }));
    setNotifsOpen(false);
    setNotifDetail(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const markRead = (ids) => setReadIds((cur) => [...new Set([...cur, ...ids])]);
  const openNotif = (id) => { setNotifDetail(id); markRead([id]); };
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <>
      <div className="safe-top" />

      <div className="app-header">
        <div className="logo-tile"><img src="./logo-icon.png" alt="SG Richard" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="app-title">SG Richard Dashboard</div>
          <div className="live-label"><span className="live-dot" />{isAdmin ? 'Mode Admin' : 'Small Group Richard'}</div>
        </div>
        {!isAdmin && (
          <button className="icon-btn" aria-label="Notifikasi" onClick={() => setNotifsOpen(true)}>
            <Bell />
            {unread > 0 && <span className="badge-count">{unread}</span>}
          </button>
        )}
        <button className="icon-btn danger" aria-label="Logout" onClick={() => setLogoutOpen(true)}>
          <LogoutIcon />
        </button>
      </div>

      <div className="scroll noscroll" ref={scrollRef}>
        {isAdmin ? (
          <>
            {tab === 'send' && <AdminSend meta={adminMeta} showToast={showToast} />}
            {tab === 'sent' && <AdminSent meta={adminMeta} showToast={showToast} onAuthError={onLogout} />}
            {tab === 'forum' && <ForumApp showToast={showToast} onAuthError={onLogout} />}
          </>
        ) : (
          <>
            {tab === 'forum' && <ForumApp showToast={showToast} onAuthError={onLogout} />}
            {tab === 'dir' && <Directory session={session} dir={dir} />}
          </>
        )}
      </div>

      <div className="tabbar-wrap">
        <nav className="tabbar" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
          {TABS.map(({ key, label, Icon }) => {
            const on = tab === key;
            return (
              <button key={key} className="tab" onClick={() => go(key)} aria-current={on ? 'page' : undefined}
                style={{ background: on ? 'rgba(108,99,255,0.18)' : 'transparent', color: on ? '#c4b5fd' : '#808a9e' }}>
                <Icon /><span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {!isAdmin && notifsOpen && (
        <NotifList notifs={notifs} loading={notifRes.loading && !notifRes.data} error={!notifRes.data && notifRes.error} onRetry={notifRes.reload}
          onClose={() => { setNotifsOpen(false); setNotifDetail(null); }} onOpen={openNotif}
          onMarkAll={() => markRead(notifs.map((n) => n.id))} />
      )}
      {!isAdmin && notifsOpen && notifDetail != null && (
        <NotifDetail notifs={notifs} id={notifDetail} onBack={() => setNotifDetail(null)} onGo={openNotif} showToast={showToast} />
      )}

      {logoutOpen && <LogoutSheet onCancel={() => setLogoutOpen(false)} onConfirm={onLogout} />}

      {toast && (
        <div className="toast" role="status">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2fd0a3', flex: 'none' }} />{toast}
        </div>
      )}
    </>
  );
}
