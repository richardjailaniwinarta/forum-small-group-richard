import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RichText } from './shared.jsx';

const EMOJI = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😅', '😢', '😭',
  '😮', '😴', '🙏', '👍', '👎', '👏', '🙌', '💪', '👋', '🤝', '✌️', '👀',
  '❤️', '🔥', '✨', '🎉', '🎊', '💯', '✅', '❌', '⚠️', '❓', '❗', '💡',
  '📌', '📢', '📅', '⏰', '📚', '📝', '💻', '📱', '🏆', '🎯', '🚀', '⭐',
];

// Tombol emoji + kotak pilihan. onPick(emoji) dipanggil saat emoji diklik.
export function EmojiButton({ onPick, className = 'f-tool', label = '😊' }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const pop = useRef(null);
  // Geser kotak emoji supaya selalu muat di layar (tombolnya bisa di kiri atau kanan).
  useLayoutEffect(() => {
    const el = pop.current;
    if (!open || !el) return;
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let dx = 0;
    if (r.right > vw - 8) dx = vw - 8 - r.right;
    if (r.left + dx < 8) dx = 8 - r.left;
    if (dx) el.style.transform = `translateX(${dx}px)`;
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!wrap.current || !wrap.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <span className="f-emoji-wrap" ref={wrap}>
      <button type="button" className={className} aria-label="Emoji" aria-expanded={open} title="Emoji"
        onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(!open)}>{label}</button>
      {open && (
        <div className="f-emoji-pop" ref={pop} role="dialog" aria-label="Pilih emoji">
          {EMOJI.map((em) => (
            <button key={em} type="button" className="f-emoji" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(em); setOpen(false); }}>{em}</button>
          ))}
        </div>
      )}
    </span>
  );
}

// Sisipkan teks di posisi kursor sebuah textarea, lalu taruh kursor sesudahnya.
export function insertAtCursor(ta, value, onChange, text) {
  const s = ta ? ta.selectionStart : value.length;
  const e = ta ? ta.selectionEnd : value.length;
  onChange(value.slice(0, s) + text + value.slice(e));
  if (ta) requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + text.length, s + text.length); });
}

const LIST_RE = { ul: /^- /, ol: /^\d{1,3}[.)] /, quote: /^> ?/, h: /^#{1,3} / };

// Kotak tulis thread: tombol format, emoji, pratinjau, tinggi kotak ikut panjang tulisan.
export default function Editor({ id, value, onChange, error, placeholder, max }) {
  const ta = useRef(null);
  const sel = useRef(null);
  const [tab, setTab] = useState('write');

  useLayoutEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
    if (sel.current) {
      const [a, b] = sel.current;
      sel.current = null;
      el.focus();
      el.setSelectionRange(a, b);
    }
  }, [value, tab]);

  const apply = (next, a, b) => { sel.current = [a, b]; onChange(next); };

  // **tebal**, _miring_, ~~coret~~: bungkus teks yang dipilih (atau hapus kalau sudah dibungkus).
  const wrap = (mark, hint) => {
    const el = ta.current;
    const s = el.selectionStart, e = el.selectionEnd;
    const L = mark.length;
    if (s >= L && value.slice(s - L, s) === mark && value.slice(e, e + L) === mark) {
      return apply(value.slice(0, s - L) + value.slice(s, e) + value.slice(e + L), s - L, e - L);
    }
    const inner = value.slice(s, e) || hint;
    apply(value.slice(0, s) + mark + inner + mark + value.slice(e), s + L, s + L + inner.length);
  };

  // Poin, nomor, kutipan, judul: tambahkan (atau hapus) awalan di setiap baris yang dipilih.
  const lines = (kind) => {
    const el = ta.current;
    const s = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
    let e = value.indexOf('\n', Math.max(el.selectionEnd - (el.selectionEnd > el.selectionStart ? 1 : 0), s));
    if (e < 0) e = value.length;
    const rows = value.slice(s, e).split('\n');
    const all = rows.every((r) => LIST_RE[kind].test(r));
    let n = 0;
    const out = rows.map((r) => {
      const bare = r.replace(LIST_RE.ul, '').replace(LIST_RE.ol, '').replace(LIST_RE.quote, '').replace(LIST_RE.h, '');
      if (all) return bare;
      if (!r.trim() && rows.length > 1) return r;
      n += 1;
      return (kind === 'ul' ? '- ' : kind === 'ol' ? n + '. ' : kind === 'quote' ? '> ' : '## ') + bare;
    }).join('\n');
    apply(value.slice(0, s) + out + value.slice(e), s + out.length, s + out.length);
  };

  const link = () => {
    const el = ta.current;
    const s = el.selectionStart, e = el.selectionEnd;
    const picked = value.slice(s, e);
    if (/^https?:\/\/\S+$/i.test(picked)) {
      const t = '[teks link](' + picked + ')';
      return apply(value.slice(0, s) + t + value.slice(e), s + 1, s + 10);
    }
    const label = picked || 'teks link';
    const t = '[' + label + '](https://)';
    const at = s + label.length + 3;
    apply(value.slice(0, s) + t + value.slice(e), at, at + 8);
  };

  const emoji = (em) => {
    const el = ta.current;
    const s = el ? el.selectionStart : value.length, e = el ? el.selectionEnd : value.length;
    apply(value.slice(0, s) + em + value.slice(e), s + em.length, s + em.length);
  };

  const onKeyDown = (ev) => {
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === 'b') { ev.preventDefault(); wrap('**', 'teks tebal'); return; }
    if (mod && ev.key.toLowerCase() === 'i') { ev.preventDefault(); wrap('_', 'teks miring'); return; }
    if (mod && ev.key.toLowerCase() === 'k') { ev.preventDefault(); link(); return; }
    // Enter di dalam daftar: lanjutkan poin/nomor berikutnya; Enter di poin kosong: keluar dari daftar.
    if (ev.key === 'Enter' && !ev.shiftKey && !mod) {
      const el = ta.current;
      if (el.selectionStart !== el.selectionEnd) return;
      const s = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
      const row = value.slice(s, el.selectionStart);
      const m = row.match(/^(- |(\d{1,3})([.)]) |> )(.*)$/);
      if (!m) return;
      ev.preventDefault();
      if (!m[4].trim()) return apply(value.slice(0, s) + value.slice(el.selectionStart), s, s);
      const next = m[2] ? Number(m[2]) + 1 + m[3] + ' ' : m[1];
      const ins = '\n' + next;
      const at = el.selectionStart;
      apply(value.slice(0, at) + ins + value.slice(at), at + ins.length, at + ins.length);
    }
  };

  const tool = (label, title, run, cls = '') => (
    <button type="button" className={'f-tool ' + cls} title={title} aria-label={title}
      onMouseDown={(e) => e.preventDefault()} onClick={run} disabled={tab !== 'write'}>{label}</button>
  );

  return (
    <div className={'f-editor' + (error ? ' err' : '')}>
      <div className="f-editor-bar">
        <div className="f-editor-tools" role="toolbar" aria-label="Format teks">
          {tool(<b>B</b>, 'Tebal (Ctrl+B)', () => wrap('**', 'teks tebal'))}
          {tool(<i>I</i>, 'Miring (Ctrl+I)', () => wrap('_', 'teks miring'))}
          {tool(<s>S</s>, 'Coret', () => wrap('~~', 'teks dicoret'))}
          {tool('H', 'Judul kecil', () => lines('h'), 'serif')}
          <span className="f-tool-sep" />
          {tool('•', 'Daftar poin', () => lines('ul'), 'big')}
          {tool('1.', 'Daftar nomor', () => lines('ol'))}
          {tool('❝', 'Kutipan', () => lines('quote'), 'big')}
          {tool('🔗', 'Link (Ctrl+K)', link)}
          {tab === 'write' ? <EmojiButton onPick={emoji} /> : <button type="button" className="f-tool" disabled aria-label="Emoji">😊</button>}
        </div>
        <div className="f-editor-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'write'} className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Tulis</button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Pratinjau</button>
        </div>
      </div>
      {tab === 'write' ? (
        <textarea id={id} ref={ta} className="f-editor-area" placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} />
      ) : (
        <div className="f-editor-preview" aria-label="Pratinjau">
          {value.trim() ? <RichText text={value} /> : <div className="f-muted">Belum ada tulisan.</div>}
        </div>
      )}
      <div className="f-editor-foot">
        <span>**tebal** · _miring_ · - poin · 1. nomor · [teks](link)</span>
        <span style={{ color: max && value.length > max ? '#ff6b6b' : undefined }}>{value.length.toLocaleString('id-ID')}/{(max || 0).toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}
