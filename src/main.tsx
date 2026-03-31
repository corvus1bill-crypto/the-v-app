import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import '@/styles/index.css'
import '@/styles/theme.css'
import '@/styles/fonts.css'

// In dev, proactively unregister any previously-registered service workers
// and clear caches so an old SW doesn't intercept requests (fixes CORS/fetch failures).
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => {
          console.log('🧹 DEV: unregistering service worker', r);
          r.unregister().catch(() => {});
        });
      }).catch(() => {});
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
      }
      // Also clear certain persistent auth state that may cause stale behavior
      try { localStorage.removeItem('thev-rest-auth'); } catch {}
      console.log('🧹 DEV: service worker unregistered and caches cleared');
    } catch (e) { /* ignore */ }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker only in production builds
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}
