import { useMemo, useState } from 'react';
import { login, SITE_URL } from '../api.js';
import { Eye, EyeOff } from '../components/Icons.jsx';

const MSG = {
  error: { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' },
  success: { background: 'rgba(47,208,163,0.08)', border: '1px solid rgba(47,208,163,0.25)', color: '#2fd0a3' }
};

function Stars() {
  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => {
    const r = (n) => { const x = Math.sin(i * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
    return { left: r(1) * 100, top: r(2) * 100, dur: 2 + r(3) * 4, delay: r(4) * 5 };
  }), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
      {stars.map((s, i) => (
        <span key={i} style={{ position: 'absolute', left: s.left + '%', top: s.top + '%', width: 2, height: 2, borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)', animation: `sgTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </div>
  );
}

export default function Login({ onLogin }) {
  const [sid, setSid] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    const id = sid.trim();
    const errs = {};
    if (!id) errs.sid = 'Student ID wajib diisi.';
    else if (!/^\d+$/.test(id)) errs.sid = 'Student ID hanya berisi angka.';
    if (!pw) errs.pw = 'Password wajib diisi.';
    setErrors(errs);
    setMsg(null);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const session = await login(id, pw);
      setMsg({ type: 'success', text: 'Login berhasil! Mengalihkan ke dashboard…' });
      setTimeout(() => onLogin(session), 600);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Student ID atau password salah. Coba lagi.' });
      setLoading(false);
    }
  };

  const siteLink = (path) => (e) => {
    e.preventDefault();
    if (SITE_URL) window.open(SITE_URL + path, '_blank', 'noopener,noreferrer');
    else setMsg({ type: 'error', text: 'Halaman ini tersedia di website SG Richard Dashboard.' });
  };

  return (
    <>
      <div style={{ position: 'absolute', width: 420, height: 420, top: -160, left: -160, borderRadius: '50%', filter: 'blur(70px)', background: 'radial-gradient(circle, rgba(108,99,255,0.28), transparent 70%)', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 320, height: 320, bottom: -110, right: -120, borderRadius: '50%', filter: 'blur(70px)', background: 'radial-gradient(circle, rgba(247,183,51,0.16), transparent 70%)', zIndex: -1, pointerEvents: 'none' }} />
      <Stars />
      <div className="safe-top" />

      <div className="scroll noscroll" style={{ padding: '12px 16px 28px' }}>
        <div style={{ animation: 'sgCardIn .5s cubic-bezier(0.22,1,0.36,1) both', background: '#0f1420', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(108,99,255,0.08),0 24px 60px rgba(0,0,0,0.55),0 0 80px rgba(108,99,255,0.06)' }}>

          <div style={{ position: 'relative', overflow: 'hidden', padding: '30px 24px 26px', background: 'linear-gradient(160deg,#131829 0%,#0f1420 60%,#0d1119 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)', isolation: 'isolate' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'radial-gradient(ellipse 200px 160px at 90% -10%, rgba(247,183,51,0.14), transparent),radial-gradient(ellipse 280px 200px at -10% 110%, rgba(108,99,255,0.20), transparent)' }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: .04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div style={{ position: 'relative', width: 48, height: 48, flex: 'none' }}>
                <div style={{ position: 'absolute', inset: -3, borderRadius: 17, padding: 1.5, background: 'linear-gradient(135deg, rgba(108,99,255,0.7), rgba(247,183,51,0.5))', animation: 'sgHue 4s linear infinite' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 15.5, background: '#131829' }} />
                </div>
                <img src="./logo-icon.png" alt="SG Richard Logo" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14, display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span className="syne nowrap" style={{ fontSize: 14, fontWeight: 700 }}>SG Richard Dashboard</span>
                <span className="nowrap" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#2fd0a3', letterSpacing: '.04em' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2fd0a3', boxShadow: '0 0 6px #2fd0a3', animation: 'sgPulse 2s ease-in-out infinite' }} />Small Group Richard
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7690', letterSpacing: '.02em', marginBottom: 6 }}>Portal Masuk</div>
            <h1 className="syne" style={{ margin: 0, fontWeight: 800, fontSize: 27, lineHeight: 1.18 }}>
              <span style={{ display: 'block' }}>Selamat Datang,</span>
              <span style={{ display: 'block', background: 'linear-gradient(90deg,#a78bfa 0%,#f7b733 60%,#a78bfa 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'sgShimmer 4s linear infinite' }}>Small Group Richard</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#6c63ff,transparent)', opacity: .3 }} />
              <span style={{ fontSize: 10, color: '#f7b733', opacity: .7 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#f7b733)', opacity: .3 }} />
            </div>
          </div>

          <form onSubmit={submit} noValidate style={{ padding: '24px 24px 30px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ margin: '0 0 22px', color: '#6b7690', fontSize: 14, lineHeight: 1.6 }}>Masuk dengan Student ID dan password kamu untuk mengakses dashboard.</p>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="sid" className="label" style={{ marginBottom: 8 }}>Student ID</label>
              <input id="sid" className={'field' + (errors.sid ? ' err' : '')} inputMode="numeric" autoComplete="username" placeholder="Contoh: 20263401122"
                value={sid} onChange={(e) => { setSid(e.target.value); setErrors({ ...errors, sid: null }); }} />
              {errors.sid && <div className="field-err">{errors.sid}</div>}
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label htmlFor="pw" className="label">Password</label>
                <a href="#" onClick={siteLink('/forgot-password/')} className="nowrap" style={{ fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Lupa password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="pw" className={'field' + (errors.pw ? ' err' : '')} style={{ paddingRight: 50 }} type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Masukkan password kamu" value={pw} onChange={(e) => { setPw(e.target.value); setErrors({ ...errors, pw: null }); }} />
                <button type="button" aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 4, top: 3, width: 44, height: 44, border: 0, background: 'transparent', color: '#6b7690', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.pw && <div className="field-err">{errors.pw}</div>}
            </div>

            <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: 12 }}>
              {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              {loading ? 'Memproses…' : 'Masuk ke Dashboard'}
            </button>

            {msg && (
              <div role="status" style={{ marginTop: 14, padding: '11px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...MSG[msg.type] }}>{msg.text}</div>
            )}

            <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#6b7690' }}>
              Belum punya akun? <a href="#" onClick={siteLink('/register/')} style={{ fontWeight: 600, textDecoration: 'none' }}>Daftar di sini</a>
            </div>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#3d4660' }}>Versi app: {__APP_BUILD__}</div>
          </form>
        </div>
      </div>
    </>
  );
}
