import { initTheme } from './utils/themeManager';
import { initFont } from './utils/fontManager';
import { initFluentDialogSnap } from './utils/fluentDialogSnap';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';

initTheme();
initFont();
initFluentDialogSnap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
