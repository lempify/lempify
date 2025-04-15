import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// import Services from "./ui/Services";
import Sites from "./ui/Sites";
import Header from "./ui/Header";
import BackgroundTexture from "./ui/BackgroundTexture";
import Sidebar from "./ui/Sidebar";

const App = () => ( 
  <Router>
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Sidebar */}
      <div className="flex flex-1">
        <Sidebar />
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
