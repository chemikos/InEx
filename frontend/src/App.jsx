// /frontend/src/App.jsx
import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom"; // <--- DODAJ WAŻNE IMPORTY
import ProfileManager from "./components/ProfileManager";
import { useProfile } from "./hooks/useProfile";

// Importujemy strony
import Dashboard from "./pages/Dashboard";
import ExpensesPage from "./pages/ExpensesPage";
import DictionariesPage from "./pages/DictionariesPage";

// Komponent do renderowania stałego paska nawigacyjnego
const Navigation = ({ profileName, selectProfile }) => (
  <header
    style={{
      borderBottom: "1px solid #eee",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <nav>
      <Link to="/" style={{ marginRight: "15px", textDecoration: "none" }}>
        Dashboard
      </Link>
      <Link
        to="/expenses"
        style={{ marginRight: "15px", textDecoration: "none" }}
      >
        Wydatki & Wpłaty
      </Link>
      <Link
        to="/dictionaries"
        style={{ marginRight: "15px", textDecoration: "none" }}
      >
        Słowniki
      </Link>
    </nav>
    <div style={{ fontSize: "14px" }}>
      Profil: <strong>{profileName}</strong> (
      <a href="#" onClick={() => selectProfile(null, null)}>
        Zmień
      </a>
      )
    </div>
  </header>
);

function App() {
  const { isProfileSelected, currentProfileName, selectProfile } = useProfile();

  if (!isProfileSelected) {
    // 1. Jeśli NIE wybrano profilu, renderujemy TYLKO manager profili
    return <ProfileManager />;
  }

  // 2. Jeśli wybrano profil, renderujemy stały layout i ścieżki (Routes)
  return (
    <div>
      <Navigation
        profileName={currentProfileName}
        selectProfile={selectProfile}
      />

      <main style={{ padding: "20px" }}>
        <Routes>
          {/* Ścieżka główna */}
          <Route path="/" element={<Dashboard />} />

          {/* Ścieżka dla wydatków */}
          <Route path="/expenses" element={<ExpensesPage />} />

          {/* Ścieżka dla słowników */}
          <Route path="/dictionaries" element={<DictionariesPage />} />

          {/* Opcjonalnie: Przekierowanie na dashboard, jeśli wejdziemy na nieznaną ścieżkę */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
