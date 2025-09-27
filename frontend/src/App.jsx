// /frontend/src/App.jsx

import React from "react";
import ProfileManager from "./components/ProfileManager";
import { useProfile } from "./hooks/useProfile";
// Możemy już użyć hooka useProfile, żeby sprawdzić stan

function App() {
  const { isProfileSelected, currentProfileName } = useProfile();

  if (!isProfileSelected) {
    // Jeśli nie wybrano profilu, wyświetlamy manager profili
    return <ProfileManager />;
  }

  // Jeśli wybrano profil, wyświetlamy główny interfejs (Dashboard)
  return (
    <div>
      <h1>Witaj w InEx!</h1>
      <p>
        Aktywny profil: <strong>{currentProfileName}</strong>
      </p>
      {/* Tutaj będziesz dodawał komponenty routingowe: Wydatki, Wpłaty, Raporty */}
      <nav>
        {/* Przykładowa nawigacja */}
        <button>Dashboard</button>
        <button>Wydatki</button>
        <button>Słowniki</button>
      </nav>
      {/* ... główna treść aplikacji ... */}
    </div>
  );
}

export default App;
