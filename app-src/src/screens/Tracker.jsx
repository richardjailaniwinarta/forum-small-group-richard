import { useState } from 'react';
import { LinkIcon } from '../components/Icons.jsx';
import { initials, normalizeBatch, openUrl } from '../lib/format.js';
import { ErrorBox } from './Today.jsx';

const FILTERS = [['all', 'Semua'], ['done', 'Selesai'], ['miss', 'Belum']];

export default function Tracker({ session, tracker }) {
  const [filter, setFilter] = useState('all');
  const d = tracker.data;
  const name = d?.nama || session.nama || '—';
  const batch = normalizeBatch(session.batch);
  const tasks = (d?.tasks || []).map((t, i) => ({ ...t, idx: i + 1 }));
  const rows = tasks.filter((t) => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  const pct = d?.completionRate || 0;

  return (
    <div className="screen">
      <div>
        <div className="sub">Progress tugas SGB VA Course</div>
        <h1 className="h1">Task Tracker</h1>
      </div>

      {tracker.loading && !d && <div className="loading"><span className="spinner" />Memuat data kamu…</div>}
      {tracker.error && !d && <ErrorBox msg={'Gagal memuat Task Tracker: ' + tracker.error} onRetry={tracker.reload} />}

      {d && (
        <>
          <div style={{ padding: 16, borderRadius: 22, background: '#12161f', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="syne" style={{ width: 52, height: 52, flex: 'none', borderRadius: '50%', background: '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>{initials(name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{name}</div>
                <div style={{ fontSize: 12, color: '#808a9e', lineHeight: 1.4 }}>SA: {d.saName || '—'}{batch && ' · Batch ' + batch}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="pill" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', color: '#b4bccb' }}>ID {d.studentId || session.studentId}</span>
              {d.package && <span className="pill" style={{ padding: '4px 10px', background: 'rgba(108,99,255,0.18)', color: '#a78bfa' }}>Paket {d.package}</span>}
              <span className="pill" style={{ padding: '4px 10px', background: 'rgba(247,183,51,0.15)', color: '#f7b733' }}>{d.hids ? '★ HIDS: ' + d.hids : 'HIDS belum dipilih'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
              <div className="mini-stat" style={{ background: 'rgba(47,208,163,0.12)', borderColor: 'rgba(47,208,163,0.25)' }}><b style={{ color: '#2fd0a3' }}>{d.completed || 0}</b><span>Selesai</span></div>
              <div className="mini-stat" style={{ background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.25)' }}><b style={{ color: '#f87171' }}>{d.pending || 0}</b><span>Belum</span></div>
              <div className="mini-stat" style={{ background: 'rgba(79,140,255,0.12)', borderColor: 'rgba(79,140,255,0.25)' }}><b style={{ color: '#7fa9ff' }}>{(d.totalScore || 0).toLocaleString('id-ID')}</b><span>Total Score</span></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span className="eyebrow">Completion rate</span>
                <span className="syne" style={{ fontWeight: 800, fontSize: 15 }}>{pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#171d2b', overflow: 'hidden' }}>
                <div style={{ height: 8, borderRadius: 999, width: Math.min(100, pct) + '%', background: 'linear-gradient(90deg,#6c63ff,#a78bfa)', transition: 'width .6s ease' }} />
              </div>
            </div>
          </div>

          <div className="seg" role="tablist">
            {FILTERS.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                style={{ background: filter === k ? 'linear-gradient(135deg,#6c63ff,#a78bfa)' : 'transparent', color: filter === k ? '#fff' : '#808a9e' }}>{l}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow">Progress tugas</div>
            {rows.map((t) => {
              const Row = t.link ? 'button' : 'div';
              return (
                <Row key={t.idx} className="task-row" {...(t.link ? { onClick: () => openUrl(t.link) } : {})}>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.35 }}>
                    <span className="eyebrow sm" style={{ letterSpacing: '.04em', lineHeight: 1.35 }}>Task #{t.idx}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</span>
                  </span>
                  <span style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className="pill" style={{ padding: '4px 9px', background: t.done ? 'rgba(47,208,163,0.15)' : 'rgba(248,113,113,0.14)', color: t.done ? '#2fd0a3' : '#f87171' }}>
                      {t.done ? '✓ Skor: ' + (t.maxScore ? t.score + '/' + t.maxScore : t.score) : '◷ Belum diberi Score'}
                    </span>
                    {t.link && <span className="nowrap" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#808a9e' }}><LinkIcon />Classroom</span>}
                  </span>
                </Row>
              );
            })}
            {!rows.length && (
              <div className="empty">{filter === 'done' ? 'Belum ada task yang diberi score.' : filter === 'miss' ? 'Semua task sudah diberi score.' : 'Belum ada task.'}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
