import { useEffect } from 'react';
import Linkified from '../components/Linkified.jsx';
import { Close } from '../components/Icons.jsx';
import { MONTH_ID } from '../lib/time.js';

export const CAT_COLOR = { 'Pengumuman': '#f7b733', 'Tanya Jawab': '#a78bfa', 'Diskusi': '#2fd0a3', 'Tips': '#7fa9ff', 'Santai': '#ff6fae' };
export const CATEGORIES = Object.keys(CAT_COLOR);
export const STAFF_ONLY = ['Pengumuman'];
export const UPLOAD_BLOCKED_MSG = 'Tidak bisa upload gambar, tanyakan admin';

export function fmtBytes(n) {
  const f = (v, d) => v.toLocaleString('id-ID', { maximumFractionDigits: d });
  if (n < 1e6) return f(n / 1e3, 0) + ' KB';
  if (n < 1e9) return f(n / 1e6, 1) + ' MB';
  return f(n / 1e9, 2) + ' GB';
}

export const LIMIT = { title: 150, threadBody: 10000, comment: 3000, images: 5 };

const tint = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

export function CatPill({ cat }) {
  const c = CAT_COLOR[cat] || '#a78bfa';
  return <span className="f-pill" style={{ background: tint(c, 0.16), color: c }}>{cat}</span>;
}

export function CatDot({ cat }) {
  return <span className="f-dot" style={{ background: CAT_COLOR[cat] || '#a78bfa' }} />;
}

const AVATAR = ['#6c63ff', '#1ea883', '#c94a83', '#4c46c9', '#b5791a', '#2c5fd6'];
export function Avatar({ name, size = 32 }) {
  const s = String(name || '?');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const ini = s.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
  return (
    <span className="f-avatar" aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: AVATAR[h % AVATAR.length] }}>{ini}</span>
  );
}

export function Badges({ author }) {
  return (
    <>
      {author.batch && <span className="f-badge">{author.batch}</span>}
      {author.badge === 'admin' && <span className="f-badge f-badge-admin">ADMIN</span>}
      {author.badge === 'moderator' && <span className="f-badge f-badge-mod">MODERATOR</span>}
    </>
  );
}

export function timeAgo(iso, now = new Date()) {
  const d = new Date(iso);
  const s = Math.max(0, (now - d) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  if (s < 2 * 86400) return 'Kemarin';
  if (s < 7 * 86400) return Math.floor(s / 86400) + ' hari lalu';
  return d.getDate() + ' ' + MONTH_ID[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '');
}

// Format teks ala forum (mirip Markdown). Teks tidak pernah dirender sebagai HTML; link hanya http(s).
//   **tebal**  _miring_  ~~coret~~  [teks](https://…)  link biasa
//   - poin   1. nomor   > kutipan   ## judul kecil   baris kosong = paragraf baru
const INLINE = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(\S(?:[^*\n]*?\S)?)\*\*|~~(\S(?:[^~\n]*?\S)?)~~|(^|[^\w])_(\S(?:[^_\n]*?\S)?)_(?!\w)/g;

function inline(text, key = 'i') {
  const out = [];
  let last = 0;
  let n = 0;
  const plain = (s) => { if (s) out.push(<Linkified key={key + n++} text={s} />); };
  const re = new RegExp(INLINE.source, 'g');
  let m;
  while ((m = re.exec(text))) {
    plain(text.slice(last, m.index));
    const k = key + n++;
    if (m[1] !== undefined) {
      if (/^https?:\/\/[^\s<>"']+$/i.test(m[2])) out.push(<a key={k} href={m[2]} target="_blank" rel="noopener noreferrer">{m[1]}</a>);
      else out.push(m[0]);
    } else if (m[3] !== undefined) out.push(<strong key={k}>{inline(m[3], k)}</strong>);
    else if (m[4] !== undefined) out.push(<s key={k}>{inline(m[4], k)}</s>);
    else {
      plain(m[5]);
      out.push(<em key={key + n++}>{inline(m[6], k)}</em>);
    }
    last = re.lastIndex;
  }
  plain(text.slice(last));
  return out;
}

const LINE = { ul: /^\s*[-*•]\s+(.*)$/, ol: /^\s*\d{1,3}[.)]\s+(.*)$/, quote: /^\s*>\s?(.*)$/, h: /^\s*#{1,3}\s+(.+)$/ };

export function parseBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const line of String(text || '').replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) { cur = null; continue; }
    let type = 'p';
    let content = line;
    for (const t of ['h', 'ul', 'ol', 'quote']) {
      const m = line.match(LINE[t]);
      if (m) { type = t; content = m[1]; break; }
    }
    if (type === 'h') { blocks.push({ type, lines: [content] }); cur = null; continue; }
    if (cur && cur.type === type) cur.lines.push(content);
    else { cur = { type, lines: [content] }; blocks.push(cur); }
  }
  return blocks;
}

export function RichText({ text, size = 15 }) {
  return (
    <div className="f-body" style={{ fontSize: size }}>
      {parseBlocks(text).map((b, i) => {
        const k = 'b' + i;
        if (b.type === 'h') return <h3 key={k} className="f-h">{inline(b.lines[0], k)}</h3>;
        if (b.type === 'ul' || b.type === 'ol') {
          const L = b.type;
          return <L key={k}>{b.lines.map((l, j) => <li key={j}>{inline(l, k + j)}</li>)}</L>;
        }
        if (b.type === 'quote') return <blockquote key={k}><p>{inline(b.lines.join('\n'), k)}</p></blockquote>;
        return <p key={k}>{inline(b.lines.join('\n'), k)}</p>;
      })}
    </div>
  );
}

export function ImageGrid({ images, onOpen }) {
  if (!images || !images.length) return null;
  return (
    <div className={'f-imgs' + (images.length === 1 ? ' one' : '')}>
      {images.map((im, i) => (
        <button key={im.id} type="button" className="f-img" onClick={() => onOpen(images, i)} aria-label={'Buka gambar ' + (i + 1)}>
          <img src={im.url} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

export function Lightbox({ images, index, onClose, onMove }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowRight') onMove(1); else if (e.key === 'ArrowLeft') onMove(-1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, onMove]);
  const im = images[index];
  return (
    <div className="f-lightbox" role="dialog" aria-label="Gambar" onClick={onClose}>
      <button type="button" className="f-lightbox-close" aria-label="Tutup gambar" onClick={onClose}><Close /></button>
      <img src={im.url} alt="" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <div className="f-lightbox-nav" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0}>Sebelumnya</button>
          <span>{index + 1} / {images.length}</span>
          <button type="button" onClick={() => onMove(1)} disabled={index === images.length - 1}>Berikutnya</button>
        </div>
      )}
    </div>
  );
}

// Daftar tindakan dari bawah (HP) atau di tengah (laptop).
export function ActionSheet({ title, subtitle, actions, onClose }) {
  return (
    <div className="sheet-backdrop" role="presentation">
      <div style={{ flex: 1 }} onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#6c63ff,#f7b733,transparent)' }} />
        <div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#808a9e', marginTop: 3 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a) => (
            <button key={a.label} type="button" className={'f-action' + (a.danger ? ' danger' : '')} onClick={a.run}>
              <span className="f-action-icon">{a.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{a.label}</span>
                {a.desc && <span style={{ fontSize: 12, color: '#808a9e' }}>{a.desc}</span>}
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="f-btn-ghost" onClick={onClose}>Batal</button>
      </div>
    </div>
  );
}
