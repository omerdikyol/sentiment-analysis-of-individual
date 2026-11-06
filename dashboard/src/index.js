import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Import i18n config
import './i18n';
// Import AuthProvider
import { AuthProvider } from './contexts/AuthContext.tsx'; // Added .tsx extension
// Import BrowserRouter
import { BrowserRouter as Router } from 'react-router-dom';

// Demo builds swap the API for generated mock data (see src/demo/mockBackend.js).
if (process.env.REACT_APP_DEMO_MODE === '1') require('./demo/mockBackend');

const root = ReactDOM.createRoot(document.getElementById('root')); // Removed 'as HTMLElement'
root.render(
  <React.StrictMode>
    <Router basename={process.env.PUBLIC_URL}>
      <AuthProvider>
        {process.env.REACT_APP_DEMO_MODE === '1' && (
          <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 2000, maxWidth: 360, background: '#1a2035', color: '#fff', font: '12px Inter, sans-serif', padding: '8px 12px', borderRadius: 8 }}>
            Demo with generated data. "Alex Example" is a fictional person; no real posts or accounts are shown.
          </div>
        )}
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
