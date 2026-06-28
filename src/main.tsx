import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import './index.css';

// Main entry point - ALL providers wrap the entire app tree
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  // Register immediately (not on 'load') so COI headers are applied ASAP
  navigator.serviceWorker
    .register('/sw.js')
    .then(async (registration) => {
      console.log('[SW] Registered:', registration.scope);

      // If a new SW is waiting, activate it immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW available — reload to activate COI headers on first load
              window.location.reload();
            }
          });
        }
      });

      // If SW was just registered (no controller yet), reload once to get COI headers
      if (!navigator.serviceWorker.controller) {
        await registration.update();
        if (registration.active) {
          console.log('[SW] Active — reloading for COI headers...');
          window.location.reload();
        }
      }
    })
    .catch((error) => {
      console.error('[SW] Registration failed:', error);
    });
}
