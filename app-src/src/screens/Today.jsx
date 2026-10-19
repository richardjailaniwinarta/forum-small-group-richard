import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown } from '../components/Icons.jsx';
import { greetSize, normalizeBatch, openUrl, parseBonusDescription, portfolioMeta } from '../lib/format.js';
import { flattenSchedule, longDay, nextEvent, tzLabel, whenLabel } from '../lib/schedule.js';

const BONUS_STYLE = {
  '4C': { bg: 'linear-gradient(155deg,#6c63ff,#4c46c9)', full: 'Confidence Coaching for Client Call' },
  'CDP': { bg: 'linear-gradient(155deg,#6fe3c0,#1ea883)', full: 'Career Development Program' },
  'EC': { bg: 'linear-gradient(155deg,#4f8cff,#2c5fd6)', full: 'English Community' },
  'GL': { bg: 'linear-gradient(155deg,#ff6fae,#c94a83)', full: 'Growth Lab' }
};

export function ErrorBox({ msg, onRetry }) {
  return (
    <div className="error-box">
      <span>{msg}</span>
      {onRetry && <button onClick={onRetry}>Coba lagi</button>}
    </div>
  );
}

function Hero({ dash, onOpenSchedule }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const ev = useMemo(() => nextEvent(flattenSchedule(dash.data?.schedule), now), [dash.data, now]);

  const hero = ev
    ? { time: ev.time || '—', title: ev.title, cat: ev.cat, when: whenLabel(ev, now), day: longDay(ev.key) + (ev.at != null && tzLabel(now) ? ' · ' + tzLabel(now) : '') }
    : { time: '—', title: dash.loading || (!dash.data && !dash.error) ? 'Memuat jadwal…' : dash.error ? 'Jadwal belum bisa dimuat' : 'Tidak ada jadwal lagi minggu ini', cat: 'Jadwal', when: '', day: '' };
  const action = ev?.link
    ? { label: 'Masuk ke Ruang Sesi', run: () => openUrl(ev.link) }
    : { label: 'Lihat di Jadwal', run: onOpenSchedule };

  return (
    <div className="grad hero">
      <div className="dots" />
      <div className="orb" style={{ width: 170, height: 170, right: -60, top: -70 }} />
      <div className="nowrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,.2)', padding: '4px 10px', borderRadius: 999, overflow: 'hidden', textOverflow: 'ellipsis' }}>Selanjutnya · {hero.cat}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{hero.when}</span>
      </div>
      <div className="syne" style={{ fontWeight: 800, fontSize: 54, lineHeight: .95, letterSpacing: '-0.02em' }}>{hero.time}</div>
      <div>
        <div className="syne" style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.25, whiteSpace: 'pre-line' }}>{hero.title}</div>
        {hero.day && <div style={{ fontSize: 13, opacity: .88, marginTop: 2 }}>{hero.day}</div>}
      </div>
      <button className="hero-btn" onClick={action.run}>{action.label}<ArrowRight /></button>
    </div>
  );
}

function BonusCard({ b, pct, approved, meta }) {
  const [open, setOpen] = useState(false);
  const style = BONUS_STYLE[b.key] || BONUS_STYLE['4C'];
  const blocks = parseBonusDescription(meta.description);
  const firstP = blocks.findIndex((x) => x.type === 'p');
  const summary = firstP >= 0 ? blocks[firstP].text : '';
  const rest = blocks.filter((_, i) => i !== firstP);
  const elig = pct >= 80 && approved;
  const reqs = [
    { text: 'Selesaikan min. 80% task wajib (sekarang ' + Math.round(pct) + '%)', ok: pct >= 80 },
    { text: 'Portfolio final di-approve oleh SA', ok: approved }
  ];
  const chip = { fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' };

  return (
    <div className="grad" style={{ borderRadius: 20, background: style.bg }}>
      <div className="dots" />
      <div className="orb" style={{ width: 130, height: 130, right: -46, top: -56 }} />
      <button className="expand-btn" onClick={() => setOpen(!open)} aria-expanded={open}
        style={{ color: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, width: '100%' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, lineHeight: 1.25 }}>
            <span className="syne" style={{ fontWeight: 700, fontSize: 17 }}>{meta.label || b.key}</span>
            <span style={{ fontSize: 12, opacity: .88 }}>{style.full}</span>
          </span>
          <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 10, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><ChevronDown /></span>
        </span>
        {summary && <span style={{ fontSize: 13, lineHeight: 1.5, opacity: .95, whiteSpace: 'pre-line' }}>{summary}</span>}
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {meta.tagLabel && <span style={{ ...chip, background: 'rgba(255,255,255,.2)' }}>{meta.tagLabel}</span>}
          <span style={{ ...chip, background: elig ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.22)' }}>{elig ? 'Eligible' : 'Syarat belum terpenuhi'}</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,.22)' }} />
          {rest.map((blk, i) => blk.type === 'list' ? (
            <ul key={i} style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>{blk.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
          ) : blk.type === 'note' ? (
            <div key={i} style={{ padding: '9px 11px', borderRadius: 12, background: 'rgba(0,0,0,.22)', fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>{blk.text}</div>
          ) : (
            <p key={i} style={{ margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{blk.text}</p>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', opacity: .88 }}>Syarat eligible</div>
          {reqs.map((r) => (
            <div key={r.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.45 }}>
              <span style={{ width: 18, height: 18, flex: 'none', marginTop: 1, borderRadius: 6, background: r.ok ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.22)', color: '#0b0e14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.ok && <Check />}</span>
              <span>{r.text}</span>
            </div>
          ))}
          {b.link && (
            <button onClick={() => openUrl(b.link)} style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: '#fff', color: '#0b0e14', fontWeight: 700, fontSize: 13, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Buka info program<ArrowRight width={14} height={14} />
            </button>
          )}
          <div style={{ padding: '9px 11px', borderRadius: 12, background: 'rgba(0,0,0,.22)', color: '#ffd2ca', fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>Jangan bagikan info ini ke student lain atau di group chat — tidak semua student menerima bonus ini.</div>
        </div>
      )}
    </div>
  );
}

export default function Today({ session, dash, bonusInfo, onOpenSchedule }) {
  const d = dash.data;
  const name = (d?.nama || session.nama || '').trim() || 'Student';
  const batch = normalizeBatch(d?.batch ?? session.batch);
  const done = d?.completed ?? 0, pending = d?.pending ?? 0, total = done + pending;
  const pct = d?.completedPct ?? (total ? Math.round((done / total) * 100) : 0);
  const ringPct = d?.ringCompletedPct ?? pct;
  const pf = portfolioMeta(d?.portfolioStatus);
  const bonuses = d?.bonuses || [];
  const bonusMeta = bonusInfo.data?.bonuses || {};

  return (
    <div className="screen today">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: '#808a9e' }}>
          <span className="nowrap">ID {d?.studentId || session.studentId}</span>
          {batch && <span className="nowrap" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', padding: '3px 10px', borderRadius: 999, background: 'rgba(247,183,51,0.15)', color: '#f7b733' }}>Batch {batch}</span>}
        </div>
        <h1 className="syne" style={{ margin: '4px 0 0', fontWeight: 800, fontSize: greetSize(name), lineHeight: 1.15, letterSpacing: '-0.01em', textWrap: 'balance' }}>
          Halo, <span style={{ background: 'linear-gradient(90deg,#f7b733,#a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{name}</span>
        </h1>
      </div>

      <Hero dash={dash} onOpenSchedule={onOpenSchedule} />

      {dash.error && !d && <ErrorBox msg={'Gagal memuat data: ' + dash.error} onRetry={dash.reload} />}

      <div className="grid-2">
        <div className="grad stat-grad" style={{ background: 'linear-gradient(155deg,#6fe3c0,#1ea883)' }}>
          <div className="orb" />
          <div style={{ fontSize: 13, fontWeight: 600, opacity: .92 }}>Tugas Sudah</div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.1, marginTop: 6 }}>{d ? done : '–'}</div>
        </div>
        <div className="grad stat-grad" style={{ background: 'linear-gradient(155deg,#ffcf6e,#d69a1f)' }}>
          <div className="orb" />
          <div style={{ fontSize: 13, fontWeight: 600, opacity: .92 }}>Tugas Belum</div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.1, marginTop: 6 }}>{d ? pending : '–'}</div>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2 className="h2">Statistics</h2></div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
              <defs><linearGradient id="sgRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6c63ff" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
              <circle cx="36" cy="36" r="30" fill="none" stroke="#171d2b" strokeWidth="7" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="url(#sgRing)" strokeWidth="7" strokeLinecap="round" strokeDasharray="188.5"
                strokeDashoffset={(188.5 * (1 - Math.min(100, Math.max(0, ringPct)) / 100)).toFixed(1)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </svg>
            <div className="syne" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{pct}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">% Completion</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2, marginTop: 2 }}>{d ? `${done} dari ${total} task` : '—'}</div>
            <div style={{ fontSize: 12, color: '#808a9e', lineHeight: 1.4, marginTop: 2 }}>Naik otomatis saat task diberi score</div>
          </div>
        </div>
        <div className="grid-2">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="eyebrow">Total Score</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: '#f7b733' }}>{d ? (d.totalScore || 0).toLocaleString('id-ID') : '—'}</div>
            <div style={{ fontSize: 12, color: '#808a9e', lineHeight: 1.4 }}>poin terkumpul</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderColor: pf.border }}>
            <div className="eyebrow">Portfolio</div>
            <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999, background: pf.bg, color: pf.fg, lineHeight: 1.3 }}>
              <span style={{ width: 6, height: 6, flex: 'none', borderRadius: '50%', background: pf.fg }} />{d ? pf.label : '—'}
            </span>
            <div style={{ fontSize: 12, color: '#808a9e', lineHeight: 1.4 }}>{d ? pf.note : ''}</div>
          </div>
        </div>
      </div>

      {bonuses.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2 className="h2">Bonus Kamu</h2>
            <span className="nowrap" style={{ fontSize: 12, color: '#808a9e' }}>{bonuses.length} program</span>
          </div>
          {bonuses.map((b) => <BonusCard key={b.key} b={b} pct={pct} approved={pf.approved} meta={bonusMeta[b.key] || {}} />)}
        </div>
      )}
    </div>
  );
}
