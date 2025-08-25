/**
 * Application entry point
 */

/**
 * External dependencies
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/**
 * Internal dependencies
 */
import Site from './ui/Site';
import Sites from './ui/Sites';
import Header from './ui/Header';
import Sidebar from './ui/Sidebar';
import Install from './ui/Install';
import Site404 from './ui/Site404';
import Page404 from './ui/Page404';
import Settings from './ui/Settings';
import Background from './ui/Background';

import { AppConfigProvider } from './context/AppConfigContext';
import { LempifydProvider } from './context/LempifydContext';
import { useA11y } from './context/A11yContext';

const App = () => {
  const { prefersReducedMotion } = useA11y();

  return (
    <AppConfigProvider>
      <LempifydProvider>
        <Router>
          <Install>
            <div className='h-screen grid grid-cols-[auto_1fr] grid-rows-[65px_1fr]'>
              {/* Header - sticky */}
              <Header />
              {/* Sidebar - sticky */}
              <Sidebar />
              {/* Main content */}
              <main className='overflow-y-auto bg-neutral-100 dark:bg-neutral-900 text-[var(--lempify-text)]'>
                {!prefersReducedMotion && <Background />}
                <div className='p-10 relative'>
                  <Routes>
                    <Route path='/' element={<></>} />
                    <Route path='/sites' element={<Sites />} />

                    <Route path='/sites/:domain' element={<Site />} />
                    <Route path='/sites/*' element={<Site404 />} />

                    <Route path='/settings' element={<Settings />} />
                    <Route path='*' element={<Page404 />} />
                  </Routes>
                </div>
              </main>
            </div>
          </Install>
        </Router>
      </LempifydProvider>
    </AppConfigProvider>
  );
};

export default App;
