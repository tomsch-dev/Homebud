import React from 'react';
import ReactDOM from 'react-dom/client';
import { LogtoProvider, LogtoConfig } from '@logto/react';
import App from './App';
import './index.css';

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || 'http://localhost:3301',
  appId: import.meta.env.VITE_LOGTO_APP_ID || 'dev-app',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LogtoProvider config={logtoConfig}>
      <App />
    </LogtoProvider>
  </React.StrictMode>
);
