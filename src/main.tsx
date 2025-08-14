// @TODO: Look into Suspense & `use` for better handling of async operations
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import './css/global.css';
import './css/bg-animation.css';
import { DarkModeProvider } from './context/DarkModeContext';
import trackMousePosition from './utils/mouse-position';
import App from './App';

const rootElement = document.getElementById('root') as HTMLElement;

trackMousePosition(rootElement);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </React.StrictMode>
);
