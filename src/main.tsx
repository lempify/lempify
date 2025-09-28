// @TODO: Look into Suspense & `use` for better handling of async operations
import React from 'react';
import ReactDOM from 'react-dom/client';

import './css/global.css';
import './css/bg-animation.css';
import { DarkModeProvider } from './context/DarkModeContext';
import trackMousePosition from './utils/mouse-position';
import App from './App';
import { A11yProvider } from './context/A11yContext';

const rootElement = document.getElementById('root') as HTMLElement;

trackMousePosition(rootElement);

ReactDOM.createRoot(rootElement).render(
 <React.StrictMode> 
    <DarkModeProvider>
      <A11yProvider>
        <App />
      </A11yProvider>
    </DarkModeProvider>
  </React.StrictMode>
);
