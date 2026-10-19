import { useState } from 'react';
import { apiPost } from '../api.js';
import { Trash } from '../components/Icons.jsx';
import { NOTIF_STYLE } from '../data/notifications.js';
import { mapNotif } from '../lib/notifs.js';
import { useResource } from '../lib/useResource.js';
import ConfirmSheet from './ConfirmSheet.jsx';
import { ErrorBox } from './Today.jsx';

export default function AdminSent({ meta, showToast, onAuthError }) {
  const batches = meta.data?.batches || [];
  const [batch, setBatch] = useState('');
  const [del, setDel] = useState(null);
  const list = useResource(batch ? '/admin/notifications?batch=' + encodeURIComponent(batch) : null, !!batch, onAuthError);
  const items = (list.data?.items || []).map((r) => ({ ...mapNotif(r), raw: r }));

  const remove = async () => {
    try {
      await apiPost('/admin/notifications/delete', { id: del.id });
      setDel(null);
      showToast('Pesan dihapus');
      list.reload();
    } catch (err) {
      setDel(null);
      showToast('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <div className="screen">
      <div>
        <div className="sub">Khusus admin</div>
        <h1 className="h1">Terkirim</h1>
        <div className="form-note" style={{ marginTop: 6 }}>Riwayat pesan per batch. Menghapus pesan membuatnya hilang dari semua student.</div>
      </div>

      <div>
        <label htmlFor="s-batch" className="label" style={{ marginBottom: 8 }}>Batch</label>
        <select id="s-batch" className="field" value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="">Pilih batch…</option>
          {batches.map((b) => <option key={b.batch} value={b.batch}>Batch {b.batch}</option>)}
        </select>
      </div>

      {list.loading && !list.data && <div className="loading"><span className="spinner" />Memuat riwayat…</div>}
      {list.error && !list.data && <ErrorBox msg={'Gagal memuat riwayat: ' + list.error} onRetry={list.reload} />}

      {items.map((n) => {
        const [bg, fg] = NOTIF_STYLE[n.kind] || ['rgba(108,99,255,0.18)', '#a78bfa'];
        return (
          <div key={n.id} className="sent-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="pill nowrap" style={{ alignSelf: 'flex-start', background: bg, color: fg, textTransform: 'uppercase', letterSpacing: '.05em' }}>{n.kind}</span>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{n.title}</div>
              </div>
              <button className="del-btn" aria-label={'Hapus ' + n.title} onClick={() => setDel(n)}><Trash /></button>
            </div>
            <div className="clamp-2" style={{ fontSize: 13, color: '#808a9e', lineHeight: 1.45 }}>{n.body.replace(/\n+/g, ' ')}</div>
            <div className="form-note">{n.date}</div>
          </div>
        );
      })}
      {batch && list.data && !items.length && <div className="empty">Belum ada pesan terkirim untuk Batch {batch}.</div>}

      {del && (
        <ConfirmSheet danger title="Hapus pesan ini?" text={`"${del.title}" akan hilang dari menu Notifikasi semua student Batch ${batch}. Ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus" onCancel={() => setDel(null)} onConfirm={remove} />
      )}
    </div>
  );
}
