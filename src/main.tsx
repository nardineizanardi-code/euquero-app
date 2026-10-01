import {StrictMode} from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const createRootFn = ReactDOMClient.createRoot || (ReactDOMClient as any).default?.createRoot;
createRootFn(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registro do Service Worker do PWA para funcionalidade offline e instalação
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.warn('Falha no registro do PWA ServiceWorker:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Permite registro em dev também se acessado diretamente
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(() => {});
  });
}
