import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// import Services from "./ui/Services";
import Sites from "./ui/Sites";
import Header from "./ui/Header";
import BackgroundTexture from "./ui/BackgroundTexture";

const App = () => ( 
  <Router>
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Sidebar */}
      <div className="flex flex-1">
        <aside className="w-64 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white border-r border-neutral-300 dark:border-neutral-700">
          <nav className="flex flex-col p-4 gap-2">
            <Link to="/" className="hover:text-[var(--lempify-accent)]">Dashboard</Link>
            <Link to="/sites" className="hover:text-[var(--lempify-accent)]">Sites</Link>
            <Link to="/settings" className="hover:text-[var(--lempify-accent)]">Settings</Link>
          </nav>
        </aside>
        <div className="flex-1">
          <main className="p-6 bg-[var(--lempify-bg)] text-[var(--lempify-text)] overflow-y-auto">
            <Routes>
              <Route path="/sites" element={<Sites />} />
              {/* <Route path="/services" element={<Services />} /> */}
            </Routes>
          </main>
          {/* <BackgroundTexture /> */}
        </div>
      </div>
    </div>
  </Router>
);


export default App;
