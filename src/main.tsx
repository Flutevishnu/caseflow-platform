import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App';
import "./index.css";
import "innovations-ui-kit/style.css";

const root = document.getElementById('root');

createRoot(root!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
