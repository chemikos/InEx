// /frontend/src/hooks/useProfile.js
import { useContext } from "react";
// Importujemy stałą kontekstu z nowego pliku
import { ProfileContext } from "../context/ProfileContextDefinition.js";

// Hook do łatwego użycia kontekstu w komponentach
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    // ... błąd
    throw new Error("useProfile musi być użyte wewnątrz ProfileProvider");
  }
  return context;
};
