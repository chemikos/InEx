// /frontend/src/main.jsx (lub main.js)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // <--- DODAJ IMPORT
import App from "./App.jsx";
import "./index.css";
import { ProfileProvider } from "./context/ProfileContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* <--- OWIJAMY CAŁĄ APLIKACJĘ */}
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </BrowserRouter>{" "}
    {/* <--- KONIEC OWIJANIA */}
  </React.StrictMode>
);
