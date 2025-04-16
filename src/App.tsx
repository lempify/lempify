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

const App = () => (
  <Router>
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1">
          <main className="p-6 bg-[var(--lempify-bg)] text-[var(--lempify-text)] overflow-y-auto">
            <Routes>
              <Route path="/sites" element={<Sites />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  </Router>
);


export default App;
