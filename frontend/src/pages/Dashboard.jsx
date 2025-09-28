// /frontend/src/pages/Dashboard.jsx
import React from "react";
import { useProfile } from "../hooks/useProfile";

const Dashboard = () => {
  const { currentProfileName } = useProfile();

  return (
    <div>
      <h2>Dashboard</h2>
      <p>
        Witaj, zarządzasz finansami profilu:{" "}
        <strong>{currentProfileName}</strong>
      </p>
      {/* Tutaj pojawi się wykres podsumowujący wydatki i wpłaty */}
    </div>
  );
};

export default Dashboard;
