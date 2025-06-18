import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./css/global.css";
import { DarkModeProvider } from "./context/DarkModeContext";
import trackMousePosition from "./utils/mouse-position";

const rootElement = document.getElementById("root") as HTMLElement;

trackMousePosition(rootElement);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </React.StrictMode>,
);
