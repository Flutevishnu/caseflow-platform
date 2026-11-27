import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App';
import "./index.css";
import "innovations-ui-kit/style.css";

const root = document.getElementById('root');

if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' });
}

createRoot(root!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
