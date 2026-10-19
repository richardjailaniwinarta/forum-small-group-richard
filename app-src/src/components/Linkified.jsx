// Ubah alamat http(s):// di dalam teks menjadi link yang bisa diklik. Hanya http/https, dibangun sebagai
// elemen React (bukan HTML mentah), jadi isi pesan tidak bisa menyisipkan kode. Tanda baca di ujung
// (titik, koma, tanda kurung, dll.) tidak ikut jadi bagian link.
const URL_RE = /(https?:\/\/[^\s<>"']+)/gi;
export default function Linkified({ text }) {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const m = part.match(/[.,;:!?)\]}]+$/);
    const tail = m ? m[0] : '';
    const url = tail ? part.slice(0, -tail.length) : part;
    return (
      <span key={i}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'underline', textUnderlineOffset: 3, overflowWrap: 'anywhere' }}>{url}</a>
        {tail}
      </span>
    );
  });
}
