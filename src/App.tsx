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
import Sites from "./ui/Sites";
import Header from "./ui/Header";
import Sidebar from "./ui/Sidebar";
import Dashboard from "./ui/Dashboard";
import Settings from "./ui/Settings";
import { useEffect } from "react";
import startPhp from "./services/startPhp";

const App = () => {
  useEffect(() => {
    startPhp();
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col ml-64">
            <main className="p-10 bg-[var(--lempify-bg)] text-[var(--lempify-text)]">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sites" element={<Sites />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
};


export default App;
