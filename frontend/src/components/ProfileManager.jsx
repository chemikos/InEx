// /frontend/src/components/ProfileManager.jsx
import React, { useState, useEffect } from "react";
import { fetchProfiles, createProfile } from "../api/profiles";
import { useProfile } from "../hooks/useProfile";

const ProfileManager = () => {
  const { currentProfileId, selectProfile } = useProfile();
  const [profiles, setProfiles] = useState([]);
  const [newProfileName, setNewProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Funkcja pobierająca profile ---
  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err.message);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Ładowanie przy pierwszym renderowaniu
  useEffect(() => {
    loadProfiles();
  }, []);

  // --- Funkcja dodająca nowy profil ---
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setError(null);
    try {
      // Wywołujemy funkcję API do dodania profilu
      const result = await createProfile(newProfileName.trim());

      // Zakładając, że backend zwraca ID_profilu lub wiadomość sukcesu
      console.log("Nowy profil utworzony:", result);

      // Po sukcesie odświeżamy listę profili i wybieramy nowy jako aktywny
      await loadProfiles();
      const newProfile =
        profiles.find((p) => p.name === newProfileName.trim()) ||
        profiles.find((p) => p.id_profile === result.profileId);

      if (newProfile) {
        selectProfile(newProfile.id_profile, newProfile.name);
      }

      setNewProfileName("");
    } catch (err) {
      setError(err.message || "Błąd podczas tworzenia profilu.");
    }
  };

  // --- Komponent jest prostym formularzem i listą ---
  if (loading) return <p>Ładowanie profili...</p>;
  if (error) return <p style={{ color: "red" }}>Błąd: {error}</p>;

  return (
    // Zastępujemy style atrybutem class
    <div className="card" style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h2>Wybierz lub utwórz profil</h2>

      {/* Lista istniejących profili */}
      <ul className="profile-list">
        {profiles.map((profile) => (
          <li
            key={profile.id_profile}
            onClick={() => selectProfile(profile.id_profile, profile.name)}
            // Używamy dynamicznej klasy 'active'
            className={`profile-item ${
              currentProfileId == profile.id_profile ? "active" : ""
            }`}
          >
            {profile.name}
            {currentProfileId == profile.id_profile && <span> (Aktywny)</span>}
          </li>
        ))}
      </ul>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #ced4da",
          margin: "20px 0",
        }}
      />

      {/* Formularz dodawania nowego profilu */}
      <form onSubmit={handleCreateProfile} style={{ display: "flex" }}>
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          placeholder="Nazwa nowego profilu"
          // Usuwamy style, dodajemy style inline dla szerokości jeśli jest konieczna
          style={{ flexGrow: 1, marginRight: "10px" }}
        />
        <button type="submit">Dodaj</button>
      </form>
    </div>
  );
};

export default ProfileManager;
