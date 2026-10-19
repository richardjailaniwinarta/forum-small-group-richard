export function initials(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '??';
}

export const normalizeBatch = (batch) => String(batch ?? '').replace(/[^0-9]/g, '');

// Ukuran "Halo, …" mengecil untuk nama panjang: 30px → minimal 18px.
export const greetSize = (name) =>
  Math.round(Math.max(18, Math.min(30, 350 / (('Halo, ' + name).length * 0.68)))) + 'px';

const PORTFOLIO = {
  review: { bg: 'rgba(167,139,250,0.16)', fg: '#a78bfa', border: 'rgba(255,255,255,0.07)', note: 'Menunggu review mentor' },
  approved: { bg: 'rgba(47,208,163,0.15)', fg: '#2fd0a3', border: 'rgba(47,208,163,0.35)', note: 'Sudah di-review' },
  minor: { bg: 'rgba(247,183,51,0.15)', fg: '#f7b733', border: 'rgba(247,183,51,0.35)', note: 'Sudah di-review · revisi kecil' },
  major: { bg: 'rgba(248,113,113,0.14)', fg: '#f87171', border: 'rgba(248,113,113,0.35)', note: 'Sudah di-review · revisi besar' },
  none: { bg: 'rgba(255,255,255,0.07)', fg: '#b4bccb', border: 'rgba(255,255,255,0.07)', note: 'Belum dikumpulkan' }
};

// Status portfolio dicocokkan dari awalan teks, sama seperti dashboard/ di website.
export function portfolioMeta(raw) {
  const label = String(raw || '').trim();
  const lower = label.toLowerCase();
  if (!label) return { label: 'Belum di Review', approved: false, ...PORTFOLIO.review };
  const kind = lower.startsWith('approve') ? 'approved'
    : lower.startsWith('major') ? 'major'
    : lower.startsWith('minor') ? 'minor'
    : lower.startsWith('no submission') || lower.startsWith('no-submission') ? 'none'
    : 'review';
  return { label, approved: kind === 'approved', ...PORTFOLIO[kind] };
}

// Kolom useful_links di Directory: baris nama diikuti baris URL.
export function parseLinks(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [];
  const lines = String(str).split('\n').map((s) => s.trim()).filter(Boolean);
  const result = [];
  let currentName = '';
  for (const line of lines) {
    if (line.startsWith('http')) {
      result.push({ name: currentName || line, url: line });
      currentName = '';
    } else {
      if (currentName) result.push({ name: currentName, url: '' });
      currentName = line;
    }
  }
  if (currentName) result.push({ name: currentName, url: '' });
  return result;
}

export const linkStyle = (u = '') =>
  /drive|docs\.google|forms/.test(u) ? ['G', 'rgba(47,208,163,0.15)', '#2fd0a3']
    : /youtu|zoom/.test(u) ? ['▶', 'rgba(248,113,113,0.14)', '#f87171']
    : /notion/.test(u) ? ['N', 'rgba(255,255,255,0.10)', '#e2e6f0']
    : /canva/.test(u) ? ['C', 'rgba(79,140,255,0.16)', '#7fa9ff']
    : ['↗', 'rgba(108,99,255,0.18)', '#a78bfa'];

const DAY_EN = { monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu', sunday: 'Minggu' };
export const dayId = (d) => DAY_EN[String(d || '').trim().toLowerCase()] || d;

// Deskripsi bonus dari /bonus-info: paragraf dipisah baris kosong, "- " untuk butir, "NOTE:" untuk catatan.
export function parseBonusDescription(text) {
  return String(text || '').trim().split(/\n\s*\n/).filter(Boolean).map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (/^NOTE\s*:/i.test(lines[0] || '')) return { type: 'note', text: lines.join(' ') };
    if (lines.every((l) => /^[-•]\s+/.test(l))) return { type: 'list', items: lines.map((l) => l.replace(/^[-•]\s+/, '')) };
    return { type: 'p', text: lines.join('\n') };
  });
}

export const openUrl = (url) => { if (/^https?:\/\//i.test(url || '')) window.open(url, '_blank', 'noopener,noreferrer'); };
