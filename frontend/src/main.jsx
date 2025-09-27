// /frontend/src/main.jsx (lub main.js, w zależności od szablonu Vite)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// Importujemy Provider
import { ProfileProvider } from "./context/ProfileContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* OWIJAMY CAŁĄ APLIKACJĘ W PROVIDER */}
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </React.StrictMode>
);
