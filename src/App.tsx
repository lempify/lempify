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
import Settings from './ui/Settings';
import Site404 from './ui/Site404';
import Page404 from './ui/Page404';
import { AppConfigProvider } from './context/AppConfigContext';
import { LempifydProvider } from './context/LempifydContext';

import Background from './ui/Background';

const App = () => {
  return (
    <AppConfigProvider>
      <LempifydProvider>
        <Router>
          <div className='h-screen grid grid-cols-[auto_1fr] grid-rows-[65px_1fr]'>
            {/* Header - sticky */}
            <Header />
            {/* Sidebar - sticky */}
            <Sidebar />
            {/* Main content */}
            <main className='overflow-y-auto bg-neutral-100 dark:bg-neutral-900 text-[var(--lempify-text)]'>
              <Background />
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
        </Router>
      </LempifydProvider>
    </AppConfigProvider>
  );
};

export default App;
