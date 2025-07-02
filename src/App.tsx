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
          <div className='h-screen grid grid-cols-[256px_1fr] grid-rows-[65px_1fr]'>
            {/* Header spans both columns */}
            <Header />

            {/* Sidebar - fixed in left column */}
            <Sidebar />

            {/* Main content - scrollable in right column */}
            <main className='overflow-y-auto bg-neutral-100 dark:bg-neutral-900 text-[var(--lempify-text)]'>
              <Background />
              <div className='p-10 relative'>
                <Routes>
                  {/* <Route path='/' element={<Dashboard />} /> */}
                  <Route path='/' element={<Sites />} />

                  <Route path='/site/:domain' element={<Site />} />
                  <Route path='/site/*' element={<Site404 />} />

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
