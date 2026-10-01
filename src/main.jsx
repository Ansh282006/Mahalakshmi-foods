import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './tokens.css';
import './i18n';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#0F0F0F',
            color: '#FEFDFB',
            borderRadius: '2px',
            padding: '14px 18px',
            fontSize: '0.92rem',
            fontWeight: '600',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          },
          success: { iconTheme: { primary: '#14513E', secondary: '#FEFDFB' } },
        }}
      />
    </AuthProvider>
  </StrictMode>
);