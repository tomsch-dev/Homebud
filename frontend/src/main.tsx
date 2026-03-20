import React from 'react';
import ReactDOM from 'react-dom/client';
import { LogtoProvider, LogtoConfig } from '@logto/react';
import AuthSync from './components/AuthSync';
import App from './App';
import './i18n';
import './index.css';

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3301',
  appId: import.meta.env.VITE_LOGTO_APP_ID || 'dev-app',
  resources: import.meta.env.VITE_LOGTO_API_RESOURCE ? [import.meta.env.VITE_LOGTO_API_RESOURCE] : undefined,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LogtoProvider config={logtoConfig}>
      <AuthSync>
        <App />
      </AuthSync>
    </LogtoProvider>
  </React.StrictMode>
);
