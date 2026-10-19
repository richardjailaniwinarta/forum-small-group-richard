export const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const FULLDOW = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// "Sekarang" dalam waktu Jakarta (WIB), apa pun zona waktu perangkat.
export const jktNow = () => {
  const u = new Date();
  return new Date(u.getTime() + u.getTimezoneOffset() * 60000 + 7 * 3600000);
};

export const dkey = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Senin–Minggu untuk minggu yang memuat tanggal t.
export const weekDays = (t) => {
  const m = new Date(t);
  m.setDate(t.getDate() + (t.getDay() === 0 ? -6 : 1 - t.getDay()));
  m.setHours(0, 0, 0, 0);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date(m);
    d.setDate(m.getDate() + i);
    return d;
  });
};

export const dayLabel = (d) => FULLDOW[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_ID[d.getMonth()];

export const hhmm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
