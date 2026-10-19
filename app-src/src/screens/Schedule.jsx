import { useMemo, useState } from 'react';
import { CAL_CAT, flattenSchedule, nextEvent, tzLabel } from '../lib/schedule.js';
import { dayLabel, dkey, DOW, MONTH_ID, weekDays } from '../lib/time.js';
import { ErrorBox } from './Today.jsx';

export default function Schedule({ dash }) {
  const now = new Date();
  const wd = weekDays(now);
  const todayKey = dkey(now);
  const [day, setDay] = useState((now.getDay() + 6) % 7);

  const events = useMemo(() => flattenSchedule(dash.data?.schedule), [dash.data]);
  const byKey = useMemo(() => {
    const m = {};
    events.forEach((e) => (m[e.key] = m[e.key] || []).push(e));
    return m;
  }, [events]);
  const nextEv = nextEvent(events, now);
  const selKey = dkey(wd[day]);
  const sessions = byKey[selKey] || [];

  const status = dash.data ? ['#2fd0a3', 'Tersinkron dengan Calendar Dashboard']
    : dash.error ? ['#f87171', 'Calendar Dashboard gagal dimuat']
    : ['#808a9e', 'Menghubungkan ke Calendar Dashboard…'];

  return (
    <div className="screen">
      <div>
        <div className="sub">Minggu ini · {wd[0].getDate()} {MONTH_ID[wd[0].getMonth()]} – {wd[6].getDate()} {MONTH_ID[wd[6].getMonth()]}</div>
        <h1 className="h1">Jadwal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#808a9e' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: status[0] }} />{status[1]}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#808a9e' }}>Jam mengikuti zona waktu perangkatmu{tzLabel(now) ? ' (' + tzLabel(now) + ')' : ''}</div>
      </div>

      <div className="week-strip">
        {wd.map((dt, i) => {
          const sel = day === i, k = dkey(dt), isT = k === todayKey;
          return (
            <button key={k} className="day-btn" onClick={() => setDay(i)} aria-pressed={sel}
              style={{ background: sel ? 'linear-gradient(160deg,#6c63ff,#4c46c9)' : '#12161f', color: sel ? '#fff' : '#e2e6f0',
                borderColor: sel ? 'transparent' : isT ? 'rgba(247,183,51,0.5)' : 'rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{DOW[dt.getDay()]}</span>
              <span className="syne" style={{ fontWeight: 700, fontSize: 17, lineHeight: 1 }}>{dt.getDate()}</span>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: (byKey[k] || []).length ? (sel ? '#fff' : '#f7b733') : 'transparent' }} />
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="syne" style={{ fontWeight: 700, fontSize: 17 }}>{dayLabel(wd[day])}</span>
        {selKey === todayKey && <span className="pill chip-gold">Hari ini</span>}
      </div>
      <div className="legend">
        {Object.entries(CAL_CAT).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!dash.data && !dash.error && <div className="loading"><span className="spinner" />Memuat jadwal…</div>}
        {dash.error && !dash.data && <ErrorBox msg={'Gagal memuat jadwal: ' + dash.error} onRetry={dash.reload} />}
        {sessions.map((s, i) => {
          const next = s === nextEv, color = CAL_CAT[s.cat] || '#f7b733';
          return (
            <div key={i} className="session" style={{ borderColor: next ? 'rgba(247,183,51,0.45)' : 'rgba(255,255,255,0.07)' }}>
              <div className="syne" style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{s.time}</div>
              <div style={{ borderRadius: 4, background: color }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="nowrap" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color }}>{s.cat}</span>
                  {s.optional && <span className="pill" style={{ padding: '1px 8px', background: 'rgba(255,255,255,0.07)', color: '#b4bccb' }}>Optional</span>}
                  {next && <span className="pill chip-gold" style={{ padding: '1px 8px' }}>Selanjutnya</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, whiteSpace: 'pre-line' }}>{s.title}</div>
              </div>
            </div>
          );
        })}
        {dash.data && !sessions.length && (
          <div className="empty">{selKey === todayKey ? 'Tidak ada jadwal hari ini 🎉' : 'Tidak ada jadwal'}</div>
        )}
      </div>
    </div>
  );
}
