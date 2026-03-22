import React from 'react';
import ReactDOM from 'react-dom/client';
import { LogtoProvider, LogtoConfig } from '@logto/react';
import { registerSW } from 'virtual:pwa-register';
import AuthSync from './components/AuthSync';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './i18n';
import './index.css';

// Register service worker — prompt user to reload when a new version is available
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of HomeBud is available. Reload to update?')) {
      updateSW(true);
    }
  },
});

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3301',
  appId: import.meta.env.VITE_LOGTO_APP_ID || 'dev-app',
  resources: import.meta.env.VITE_LOGTO_API_RESOURCE ? [import.meta.env.VITE_LOGTO_API_RESOURCE] : undefined,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LogtoProvider config={logtoConfig}>
        <AuthSync>
          <App />
        </AuthSync>
      </LogtoProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
