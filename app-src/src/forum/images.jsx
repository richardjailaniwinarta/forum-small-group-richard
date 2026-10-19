import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUpload, AuthError } from '../api.js';
import { Close, ImageIcon } from '../components/Icons.jsx';
import { LIMIT, UPLOAD_BLOCKED_MSG } from './shared.jsx';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DIM = 1600;

async function decode(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* coba cara lain */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Foto dikecilkan (sisi terpanjang 1600 px) dan disimpan ulang sebagai JPG di HP sebelum diunggah.
// Hasilnya jauh lebih kecil dari 2 MB, dan data tersembunyi foto (termasuk lokasi GPS) ikut terbuang.
export async function compressImage(file) {
  if (!/^image\//.test(file.type || '') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '')) {
    throw new Error('Hanya file gambar (JPG, PNG, atau WebP).');
  }
  let src;
  try { src = await decode(file); } catch { throw new Error('Gambar tidak bisa dibaca. Coba gambar lain.'); }
  const w0 = src.width, h0 = src.height;
  const scale = Math.min(1, MAX_DIM / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w0 * scale));
  canvas.height = Math.max(1, Math.round(h0 * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // PNG transparan -> latar putih (JPG tidak punya transparansi)
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  if (src.close) src.close();
  for (const q of [0.85, 0.75, 0.62, 0.5]) {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error('Gambar terlalu besar. Maksimal 2 MB.');
}

let seq = 0;

// Daftar gambar untuk satu posting: dipilih -> dikecilkan -> diunggah ke server (R2).
export function useImagePicker({ showToast, onAuthError }) {
  const [items, setItems] = useState([]); // { key, preview, id, status: 'uploading' | 'done' }
  const inputRef = useRef(null);
  const previews = useRef([]);

  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = useCallback(async (fileList) => {
    const files = [...fileList];
    const room = LIMIT.images - items.length;
    if (room <= 0) { showToast(`Maksimal ${LIMIT.images} gambar per posting`); return; }
    if (files.length > room) showToast(`Hanya ${room} gambar lagi yang bisa ditambahkan`);
    for (const file of files.slice(0, room)) {
      const key = ++seq;
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      setItems((cur) => [...cur, { key, preview, id: null, status: 'uploading' }]);
      try {
        const blob = await compressImage(file);
        const r = await apiUpload('/forum/images', blob);
        setItems((cur) => cur.map((x) => (x.key === key ? { ...x, id: r.id, status: 'done' } : x)));
      } catch (err) {
        setItems((cur) => cur.filter((x) => x.key !== key));
        if (err instanceof AuthError) onAuthError();
        showToast(err.message || 'Gagal mengunggah gambar');
      }
    }
  }, [items.length, showToast, onAuthError]);

  return {
    items,
    busy: items.some((x) => x.status === 'uploading'),
    ids: items.filter((x) => x.id).map((x) => x.id),
    full: items.length >= LIMIT.images,
    add,
    remove: (key) => setItems((cur) => cur.filter((x) => x.key !== key)),
    reset: () => setItems([]),
    open: () => inputRef.current && inputRef.current.click(),
    input: (
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden
        onChange={(e) => { add(e.target.files || []); e.target.value = ''; }} />
    )
  };
}

export function ImageThumbs({ picker }) {
  if (!picker.items.length) return null;
  return (
    <div className="f-thumbs">
      {picker.items.map((x) => (
        <div key={x.key} className="f-thumb">
          <img src={x.preview} alt="" />
          {x.status === 'uploading' && <span className="f-thumb-busy"><span className="spinner" /></span>}
          <button type="button" aria-label="Hapus gambar" onClick={() => picker.remove(x.key)}><Close width={12} height={12} /></button>
        </div>
      ))}
      <span className="f-thumbs-count">{picker.items.length}/{LIMIT.images}</span>
    </div>
  );
}

export function AddImageButton({ picker, label, blocked }) {
  return (
    <button type="button" className={label ? 'f-addimg' : 'f-iconbtn'} onClick={picker.open} disabled={picker.full || blocked}
      aria-label={label ? undefined : blocked ? UPLOAD_BLOCKED_MSG : 'Tambah gambar'} title={blocked ? UPLOAD_BLOCKED_MSG : undefined}>
      <ImageIcon width={18} height={18} />
      {label && <span>{blocked ? UPLOAD_BLOCKED_MSG : picker.full ? 'Maksimal 5 gambar' : label}</span>}
    </button>
  );
}
