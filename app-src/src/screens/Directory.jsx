import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, Clock, External, Play, Search } from '../components/Icons.jsx';
import { dayId, linkStyle, normalizeBatch, parseLinks } from '../lib/format.js';
import { localizeWeekly } from '../lib/schedule.js';
import { ErrorBox } from './Today.jsx';

const WEEK_COLOR = { 'Week 0': '#b4bccb', 'Week 1': '#ffcf6e', 'Week 2': '#2fd0a3', 'Week 3': '#6c63ff', 'Week 4': '#a78bfa', 'Week 5': '#ff6fae', 'Week 6': '#6fe3c0', 'Week 7': '#f7b733' };
const WEEK_TITLE = { 'Week 0': 'Preparation', 'Week 7': 'Graduation' };
const DEPT = {
  sa: ['rgba(247,183,51,0.15)', '#f7b733'], product: ['rgba(108,99,255,0.18)', '#a78bfa'],
  course: ['rgba(47,208,163,0.15)', '#2fd0a3'], mentor: ['rgba(47,208,163,0.15)', '#2fd0a3'],
  community: ['rgba(79,140,255,0.16)', '#7fa9ff'], ops: ['rgba(79,140,255,0.16)', '#7fa9ff']
};
const deptStyle = (pic) => DEPT[String(pic || '').replace(/\s*dept$/i, '').trim().toLowerCase()] || ['rgba(255,255,255,0.06)', '#b4bccb'];
const weekNum = (w) => parseInt(String(w).replace(/\D/g, ''), 10) || 0;
const colorOf = (w) => WEEK_COLOR[w] || '#a78bfa';

function DirCard({ d, color }) {
  const [open, setOpen] = useState(false);
  const [deptBg, deptFg] = deptStyle(d.pic);
  return (
    <div style={{ borderRadius: 18, background: '#12161f', border: '1px solid ' + (open ? color + '66' : 'rgba(255,255,255,0.07)'), overflow: 'hidden' }}>
      <button className="expand-btn" onClick={() => setOpen(!open)} aria-expanded={open} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
          <span className="syne" style={{ fontWeight: 700, fontSize: 13, color, flex: 'none', lineHeight: 1.5 }}>#{d.no}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{d.content}</span>
          <span style={{ flex: 'none', display: 'flex', color: '#808a9e', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', marginTop: 2 }}><ChevronDown /></span>
        </span>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {d.day && <span className="meta-pill"><Calendar />{dayId(d.day)}</span>}
          {d.time && <span className="meta-pill"><Clock />{d.time}</span>}
          {d.pic && <span className="pill" style={{ background: deptBg, color: deptFg }}>{d.pic}</span>}
          {d.links.length > 0 && <span className="pill" style={{ background: 'rgba(79,140,255,0.16)', color: '#7fa9ff' }}>{d.links.length} link</span>}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
          {d.remark && (
            <div>
              <div className="eyebrow sm" style={{ marginBottom: 4 }}>Remark</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: '#c9cfdb', whiteSpace: 'pre-line' }}>{d.remark}</div>
            </div>
          )}
          {d.recording && (
            <a className="rec-btn" href={d.recording} target="_blank" rel="noopener noreferrer"><Play />Buka Recording</a>
          )}
          {d.links.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="eyebrow sm">Useful Links</div>
              {d.links.map((l, i) => {
                const [abbr, bg, fg] = linkStyle(l.url);
                const body = (
                  <>
                    <span className="link-abbr" style={{ background: bg, color: fg }}>{abbr}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</span>
                      {l.url && <span style={{ fontSize: 11, color: '#808a9e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.url.replace(/^https?:\/\//, '')}</span>}
                    </span>
                    {l.url && <External style={{ color: '#808a9e', flex: 'none' }} />}
                  </>
                );
                return l.url
                  ? <a key={i} className="link-row" href={l.url} target="_blank" rel="noopener noreferrer">{body}</a>
                  : <div key={i} className="link-row">{body}</div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Directory({ session, dir }) {
  const [query, setQuery] = useState('');
  const [week, setWeek] = useState('all');

  const items = useMemo(() => (dir.data?.items || []).map((t) => ({
    ...t, no: String(t.no ?? ''), week: String(t.week || '').trim(), content: String(t.content || ''),
    remark: String(t.remark || '').trim(), links: parseLinks(t.useful_links ?? t.links),
    ...localizeWeekly(t.day, t.time) // hari & jam sesuai zona waktu perangkat
  })), [dir.data]);
  const weeks = useMemo(() => [...new Set(items.map((d) => d.week))].filter(Boolean).sort((a, b) => weekNum(a) - weekNum(b)), [items]);

  const q = query.toLowerCase().trim();
  const filtered = items.filter((d) => (week === 'all' || d.week === week) &&
    (!q || (d.content + ' ' + d.remark + ' ' + d.links.map((l) => l.name).join(' ')).toLowerCase().includes(q)));
  const groups = weeks.map((w) => ({ week: w, items: filtered.filter((d) => d.week === w) })).filter((g) => g.items.length);
  const batch = normalizeBatch(dir.data?.batch ?? session.batch);

  return (
    <div className="screen">
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f7b733' }}>Small Group Richard Internal</div>
        <h1 className="h1">B{batch} Directory</h1>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#808a9e', marginTop: 4 }}>Semua hal penting yang mendukung jalannya SGB VA Course.</div>
      </div>

      <label className="search">
        <Search />
        <input type="search" placeholder="Cari file atau task…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari file atau task" />
      </label>

      <div className="chips noscroll">
        {['all', ...weeks].map((w) => {
          const sel = week === w, c = w === 'all' ? '#e2e6f0' : colorOf(w);
          return (
            <button key={w} className="week-chip" onClick={() => setWeek(w)} aria-pressed={sel}
              style={{ borderColor: sel ? '#7c6fff' : 'rgba(255,255,255,0.08)', background: sel ? 'rgba(108,99,255,0.22)' : '#12161f', color: sel ? '#fff' : '#b4bccb' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
              {w === 'all' ? 'Semua' : w}
              <span style={{ fontSize: 11, opacity: .7 }}>{w === 'all' ? items.length : items.filter((d) => d.week === w).length}</span>
            </button>
          );
        })}
      </div>

      {dir.loading && !dir.data && <div className="loading"><span className="spinner" />Memuat directory…</div>}
      {dir.error && !dir.data && <ErrorBox msg={'Gagal memuat directory: ' + dir.error} onRetry={dir.reload} />}

      {groups.map((g) => {
        const color = colorOf(g.week);
        return (
          <div key={g.week} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pill" style={{ letterSpacing: '.04em', padding: '4px 10px', background: color + '26', color }}>{g.week}</span>
              {WEEK_TITLE[g.week] && <span className="syne nowrap" style={{ fontWeight: 700, fontSize: 15 }}>{WEEK_TITLE[g.week]}</span>}
              <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span className="nowrap" style={{ fontSize: 12, color: '#808a9e' }}>{g.items.length} file</span>
            </div>
            {g.items.map((d) => <DirCard key={d.no + d.content} d={d} color={color} />)}
          </div>
        );
      })}

      {dir.data && !groups.length && (
        <div className="empty">{items.length ? 'Tidak ada file yang cocok dengan pencarian.' : 'Belum ada file di directory.'}</div>
      )}
    </div>
  );
}
