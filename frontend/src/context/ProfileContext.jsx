// /frontend/src/context/ProfileContext.jsx

import React, { useState, useEffect } from "react";
// Importujemy stałą kontekstu z nowego pliku
import { ProfileContext } from "./ProfileContextDefinition.js";

// Główny Provider - JEDYNY eksportowany element
export const ProfileProvider = ({ children }) => {
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const [currentProfileName, setCurrentProfileName] = useState(null);

  const selectProfile = (id, name) => {
    setCurrentProfileId(id);
    setCurrentProfileName(name);
    localStorage.setItem("selectedProfileId", id);
    localStorage.setItem("selectedProfileName", name);
  };

  useEffect(() => {
    const storedId = localStorage.getItem("selectedProfileId");
    const storedName = localStorage.getItem("selectedProfileName");
    if (storedId) {
      setCurrentProfileId(parseInt(storedId));
      setCurrentProfileName(storedName);
    }
  }, []);

  const value = {
    currentProfileId,
    currentProfileName,
    selectProfile,
    isProfileSelected: !!currentProfileId,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
