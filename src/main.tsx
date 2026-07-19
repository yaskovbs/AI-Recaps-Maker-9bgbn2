import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(async (registration) => {
      console.log('[SW] Registered:', registration.scope);

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // A first-time reload is required once so the service worker can apply
      // cross-origin-isolation headers. Later updates activate silently and
      // never interrupt an active page or processing session.
      const firstControlKey = 'recaps-sw-first-control-reload';
      if (!navigator.serviceWorker.controller && !sessionStorage.getItem(firstControlKey)) {
        await navigator.serviceWorker.ready;
        sessionStorage.setItem(firstControlKey, '1');
        window.location.reload();
      }
    })
    .catch((error) => {
      console.error('[SW] Registration failed:', error);
    });
}
