import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./css/global.css";
import { DarkModeProvider } from "./context/DarkModeProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </React.StrictMode>,
);
