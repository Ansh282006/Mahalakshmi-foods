import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1a2332',
            color: '#fff',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '0.95rem',
            fontWeight: '500',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          },
          success: { iconTheme: { primary: '#4CAF50', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </StrictMode>
);