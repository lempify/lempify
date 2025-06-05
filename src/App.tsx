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
import { ServiceProvider } from "./context/ServiceContext";

import useLempifyd from "./hooks/useLempifyd";
import CanvasBackground from "./ui/CanvasBackground";
import { AppConfigProvider } from "./context/AppConfigContext";

const App = () => {
  // Start Nginx, MySQL, PHP services
  useLempifyd();

  return (
    <AppConfigProvider>
      <ServiceProvider>
        <Router>
          <div className="flex flex-col h-full">
            <Header />
            <div className="flex h-full">
              <Sidebar />
              <div className="flex-1 flex flex-col ml-64 h-full">
                <main className="p-10 bg-neutral-100 dark:bg-neutral-900 text-[var(--lempify-text)] relative">
                  <CanvasBackground />
                  <div className="relative">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/sites" element={<Sites />} />
                      <Route path="/site/:domain" element={<Site />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </Router>
      </ServiceProvider>
    </AppConfigProvider>
  );
};

export default App;
