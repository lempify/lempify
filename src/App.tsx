/**
 * Application entry point
 */

/**
 * External dependencies
 */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/**
 * Internal dependencies
 */
import Site from "./ui/Site";
import Sites from "./ui/Sites";
import Header from "./ui/Header";
import Sidebar from "./ui/Sidebar";
import Dashboard from "./ui/Dashboard";
import Settings from "./ui/Settings";
import { AppConfigProvider } from "./context/AppConfigContext";
import { ServicesProvider } from "./context/ServicesContext";

import useLempifyd from "./hooks/useLempifyd";

// import CanvasBackground from "./ui/CanvasBackground";
// import Background from "./ui/Background";
import Background from "./ui/Background";

const App = () => {
  // Start Nginx, MySQL, PHP services
  useLempifyd();

  return (
    <AppConfigProvider>
      <ServicesProvider>
        <Router>
          <div className="h-screen grid grid-cols-[256px_1fr] grid-rows-[65px_1fr]">

            {/* Header spans both columns */}
            <Header />

            {/* Sidebar - fixed in left column */}
            <Sidebar />

            {/* Main content - scrollable in right column */}
            <main className="overflow-y-auto bg-neutral-100 dark:bg-neutral-900 text-[var(--lempify-text)]">
              <Background />
              <div className="p-10 relative">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/sites" element={<Sites />} />
                  <Route path="/site/:domain" element={<Site />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </main>
          </div>
        </Router>
      </ServicesProvider>
    </AppConfigProvider>
  );
};

export default App;
