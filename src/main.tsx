// @TODO: Look into Suspense & `use` for better handling of async operations
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import './css/global.css';
import './css/bg-animation.css';
import { DarkModeProvider } from './context/DarkModeContext';
import trackMousePosition from './utils/mouse-position';

const rootElement = document.getElementById('root') as HTMLElement;

trackMousePosition(rootElement);

const App = lazy(() => import('./App'));
const Install = lazy(() => import('./ui/Install'));


ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DarkModeProvider>
      <Suspense fallback={<div>Loading...</div>}>
        {false ? <Install /> : <App />}
      </Suspense>
    </DarkModeProvider>
  </React.StrictMode>
);
