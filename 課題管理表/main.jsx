import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './write-game-config.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

