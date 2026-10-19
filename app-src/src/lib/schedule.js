import { dkey, fromKey, FULLDOW, MONTH_ID } from './time.js';

export const CAL_CAT = { 'Live Lesson': '#6c63ff', 'Recording': '#2fd0a3', 'Task Deadline': '#f7b733' };

// Jadwal dari Worker memakai waktu Jakarta (WIB, UTC+7). Di sini jam & tanggal diubah ke zona waktu
// perangkat student, jadi semua tampilan jam otomatis mengikuti lokasi student.
const JKT_MS = 7 * 3600000;
const CLOCK_RE = /(\d{1,2})([:.])(\d{2})/g;
const pad2 = (n) => String(n).padStart(2, '0');

// Waktu nyata (ms UTC) dari tanggal Jakarta 'YYYY-MM-DD' + jam:menit Jakarta.
const jktInstant = (key, h, m) => {
  const [y, mo, d] = key.split('-').map(Number);
  return Date.UTC(y, mo - 1, d, h, m) - JKT_MS;
};

// Ubah teks jam Jakarta (mis. "19.30", "19:00 JKT", "19:00 - 21:00") ke jam lokal.
// Tanggal ikut berubah kalau melewati tengah malam. Teks tanpa jam dibiarkan apa adanya.
export function localizeTime(key, timeStr) {
  const raw = String(timeStr || '').replace(/\s*(JKT|WIB)\s*/gi, ' ').trim();
  let first = null;
  const time = raw.replace(CLOCK_RE, (full, h, sep, m) => {
    const H = +h, M = +m;
    if (H > 23 || M > 59) return full;
    const at = jktInstant(key, H, M);
    if (first === null) first = at;
    const d = new Date(at);
    return pad2(d.getHours()) + sep + pad2(d.getMinutes());
  });
  if (first === null) return { key, time: raw, at: null };
  return { key: dkey(new Date(first)), time, at: first };
}

const DAY_INDEX = { minggu: 0, sunday: 0, senin: 1, monday: 1, selasa: 2, tuesday: 2, rabu: 3, wednesday: 3, kamis: 4, thursday: 4, jumat: 5, friday: 5, sabtu: 6, saturday: 6 };

// Untuk jadwal mingguan tanpa tanggal (Directory: "Senin 19:00"): pakai hari tsb pada minggu Jakarta saat ini.
export function localizeWeekly(dayName, timeStr, now = new Date()) {
  const idx = DAY_INDEX[String(dayName || '').trim().toLowerCase()];
  if (idx === undefined || !/\d{1,2}[:.]\d{2}/.test(String(timeStr || ''))) return { day: dayName, time: timeStr };
  const j = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + JKT_MS); // getter lokal = jam dinding Jakarta
  const mon = new Date(j);
  mon.setDate(j.getDate() + (j.getDay() === 0 ? -6 : 1 - j.getDay()));
  const target = new Date(mon);
  target.setDate(mon.getDate() + ((idx + 6) % 7));
  const l = localizeTime(dkey(target), timeStr);
  return { day: FULLDOW[fromKey(l.key).getDay()], time: l.time };
}

// Singkatan zona waktu perangkat, mis. "WIB", "WITA", "GMT+9".
export function tzLabel(date = new Date()) {
  try {
    const p = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(date).find((x) => x.type === 'timeZoneName');
    return p ? p.value : '';
  } catch { return ''; }
}

// `schedule` dari /me/dashboard: [{ date: 'YYYY-MM-DD' (Jakarta), isToday, items: [{ time, category, title, optional }] }]
export function flattenSchedule(schedule) {
  return (schedule || []).flatMap((day) => (day.items || []).map((it) => {
    const l = localizeTime(day.date, it.time);
    return {
      key: l.key, time: l.time, at: l.at,
      cat: String(it.category || '').trim() || 'Event',
      title: String(it.title || '').trim().replace(/\r\n?/g, '\n'),
      optional: it.optional === true || String(it.optional).toUpperCase() === 'TRUE',
      link: it.link || it.url || ''
    };
  })).filter((e) => e.key && e.title)
    .sort((a, b) => a.key.localeCompare(b.key) || (a.at ?? 0) - (b.at ?? 0));
}

export function nextEvent(events, now = new Date()) {
  const todayKey = dkey(now), t = now.getTime();
  return events.find((e) => (e.at != null ? e.at >= t : e.key >= todayKey)) || null;
}

// Label "x menit lagi" / "x jam lagi" / nama hari untuk kartu Selanjutnya.
export function whenLabel(ev, now = new Date()) {
  if (!ev) return '';
  if (ev.key !== dkey(now)) return FULLDOW[fromKey(ev.key).getDay()];
  if (ev.at == null) return 'Hari ini';
  const diff = Math.max(0, Math.round((ev.at - now.getTime()) / 60000));
  return diff < 60 ? diff + ' menit lagi' : Math.floor(diff / 60) + ' jam lagi';
}

export const longDay = (key) => {
  const d = fromKey(key);
  return FULLDOW[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_ID[d.getMonth()];
};
