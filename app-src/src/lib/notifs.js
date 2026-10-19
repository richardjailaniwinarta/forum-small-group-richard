import { FULLDOW, MONTH_ID, DOW } from './time.js';

// created_at dari server (ISO/UTC) ditampilkan dalam zona waktu perangkat student.
const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function mapNotif(row, now = new Date()) {
  const d = new Date(row.created_at);
  const diff = Math.round((midnight(now) - midnight(d)) / 86400000);
  const time = diff <= 0 ? hm(d) : diff === 1 ? 'Kemarin' : diff < 7 ? DOW[d.getDay()] : d.getDate() + ' ' + MONTH_ID[d.getMonth()];
  return {
    id: row.id, kind: row.kind, title: row.title, body: row.body, time,
    date: FULLDOW[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_ID[d.getMonth()] + ' · ' + hm(d),
    // Pengirim selalu sama (keputusan): Richard · Student Advisor.
    sender: 'Richard', role: 'Student Advisor',
    links: row.link_url ? [{ name: row.link_name || 'Buka link', url: row.link_url }] : []
  };
}
