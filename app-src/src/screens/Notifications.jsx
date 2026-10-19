import { ArrowLeft, ChevronLeft, ChevronRight, External, LinkIcon } from '../components/Icons.jsx';
import { NOTIF_STYLE } from '../data/notifications.js';
import { initials, openUrl } from '../lib/format.js';
import Linkified from '../components/Linkified.jsx';

const styleOf = (kind) => NOTIF_STYLE[kind] || ['rgba(108,99,255,0.18)', '#a78bfa'];

export function NotifList({ notifs, loading, error, onRetry, onClose, onOpen, onMarkAll }) {
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div className="overlay" style={{ zIndex: 5 }} role="dialog" aria-label="Notifikasi">
      <div className="overlay-head">
        <button className="icon-btn lg" aria-label="Kembali" onClick={onClose}><ArrowLeft /></button>
        <span className="syne nowrap" style={{ fontWeight: 700, fontSize: 19, marginRight: 'auto' }}>Notifikasi</span>
        <button className="text-btn" onClick={onMarkAll} disabled={!unread} style={{ opacity: unread ? 1 : 0.4 }}>Tandai semua dibaca</button>
      </div>
      <div className="overlay-body noscroll">
        {loading && <div className="loading"><span className="spinner" />Memuat notifikasi…</div>}
        {error && <div className="error-box"><span>Gagal memuat notifikasi: {error}</span><button onClick={onRetry}>Coba lagi</button></div>}
        {!loading && !error && !notifs.length && <div className="empty">Belum ada notifikasi.</div>}
        {notifs.map((n) => {
          const [iconBg, iconFg] = styleOf(n.kind);
          return (
            <button key={n.id} className="notif" onClick={() => onOpen(n.id)}
              style={{ background: n.read ? 'transparent' : '#12161f', borderColor: n.read ? 'rgba(255,255,255,0.05)' : 'rgba(108,99,255,0.35)' }}>
              <span className="syne" style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg, color: iconFg, fontWeight: 800, fontSize: 14 }}>{n.kind[0]}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, lineHeight: 1.35 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, lineHeight: 1.4, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#808a9e' }}>
                  <span className="nowrap">{n.kind}</span><span className="nowrap">{n.time}</span>
                </span>
                <span style={{ fontSize: 15, fontWeight: n.read ? 500 : 700, lineHeight: 1.3 }}>{n.title}</span>
                <span className="clamp-2" style={{ fontSize: 13, color: '#808a9e', lineHeight: 1.4 }}>{n.body.replace(/\n+/g, ' ')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#a78bfa', marginTop: 2 }}>Baca selengkapnya<ChevronRight width={12} height={12} strokeWidth={2.6} /></span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NotifDetail({ notifs, id, onBack, onGo, showToast }) {
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  const n = notifs[idx];
  const [iconBg, iconFg] = styleOf(n.kind);
  const noPrev = idx === 0, noNext = idx === notifs.length - 1;

  return (
    <div className="overlay" style={{ zIndex: 6, animation: 'sgFade .2s ease-out' }} role="dialog" aria-label="Pesan">
      <div className="overlay-head">
        <button className="icon-btn lg" aria-label="Kembali ke Notifikasi" onClick={onBack}><ArrowLeft /></button>
        <span className="syne nowrap" style={{ fontWeight: 700, fontSize: 17, marginRight: 'auto' }}>Pesan</span>
        <span className="nowrap" style={{ fontSize: 12, color: '#808a9e' }}>{idx + 1} dari {notifs.length}</span>
      </div>
      <div className="overlay-body noscroll" style={{ gap: 18, paddingBottom: 'calc(28px + var(--safe-bottom))' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="nowrap" style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: iconBg, color: iconFg }}>{n.kind}</span>
          <h1 className="syne" style={{ margin: 0, fontWeight: 800, fontSize: 24, lineHeight: 1.25, textWrap: 'pretty' }}>{n.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="syne" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials(n.sender)}</span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{n.sender}</span>
              <span style={{ fontSize: 12, color: '#808a9e' }}>{n.role} · {n.date}</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {n.body.split(/\n\n+/).map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: '#c9cfdb', whiteSpace: 'pre-line', textWrap: 'pretty', overflowWrap: 'anywhere' }}><Linkified text={p} /></p>
          ))}
        </div>
        {n.links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow sm">Lampiran &amp; link</div>
            {n.links.map((l, i) => (
              <button key={i} className="link-row" style={{ padding: 12, borderRadius: 14, background: '#12161f', borderColor: 'rgba(255,255,255,0.07)', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => (l.url ? openUrl(l.url) : showToast('Link belum tersedia'))}>
                <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 10, background: 'rgba(108,99,255,0.18)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LinkIcon width={16} height={16} /></span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600 }}>{l.name}</span>
                <External style={{ color: '#808a9e', flex: 'none' }} />
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button className="nav-btn" disabled={noPrev} onClick={() => onGo(notifs[idx - 1].id)} style={{ justifyContent: 'flex-start' }}><ChevronLeft />Sebelumnya</button>
          <button className="nav-btn" disabled={noNext} onClick={() => onGo(notifs[idx + 1].id)} style={{ justifyContent: 'space-between' }}>Berikutnya<ChevronRight /></button>
        </div>
      </div>
    </div>
  );
}
