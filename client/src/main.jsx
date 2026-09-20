import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

import { loader } from '@monaco-editor/react';

// Suppress benign Monaco cancellation rejection triggered by React StrictMode double-mounting
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.type === 'cancelation') {
    event.preventDefault();
  }
});

// Pre-initialize Monaco so editor loads fast and cleanly
loader.init().catch((err) => {
  if (err?.type !== 'cancelation') {
    console.error('Monaco init error:', err);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
