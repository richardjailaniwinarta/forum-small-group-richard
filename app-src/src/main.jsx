import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

// Saat ada versi baru: service worker baru aktif lalu halaman otomatis dimuat ulang (mode autoUpdate).
// Cek pembaruan juga setiap app dibuka kembali ke layar depan, supaya tidak tertinggal di versi lama.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
