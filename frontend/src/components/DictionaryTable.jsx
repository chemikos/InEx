// /frontend/src/components/DictionaryTable.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useProfile } from "../hooks/useProfile";

const DictionaryTable = ({
  title,
  fetchFn,
  createFn,
  deleteFn,
  idKey,
  nameKey,
}) => {
  const { currentProfileId } = useProfile();
  const [entries, setEntries] = useState([]);
  const [newEntryName, setNewEntryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await fetchFn(currentProfileId);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentProfileId, fetchFn]);

  useEffect(() => {
    if (currentProfileId) {
      loadEntries();
    }
  }, [currentProfileId, loadEntries]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newEntryName.trim();
    if (!name) return;

    setError(null);
    setSuccess(null);

    try {
      await createFn(currentProfileId, name);
      setNewEntryName("");
      setSuccess(`${title.slice(0, -1)} "${name}" został pomyślnie dodany.`);
      await loadEntries();
    } catch (err) {
      setError(
        err.message ||
          `Błąd podczas dodawania ${title.slice(0, -1).toLowerCase()}.`
      );
    }
  };

  const handleDelete = async (id, name) => {
    // Prosty dialog potwierdzenia
    if (
      !window.confirm(
        `Czy na pewno chcesz usunąć ${title
          .slice(0, -1)
          .toLowerCase()} "${name}"? Może być powiązany z danymi finansowymi!`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deleteFn(currentProfileId, id);
      setSuccess(`${title.slice(0, -1)} "${name}" został pomyślnie usunięty.`);
      await loadEntries();
    } catch (err) {
      setError(
        err.message ||
          `Błąd podczas usuwania ${title.slice(0, -1).toLowerCase()}.`
      );
    }
  };

  if (!currentProfileId) {
    return <p>Wybierz profil, aby zarządzać słownikami.</p>;
  }

  return (
    <div className="card">
      <h3>
        {title} ({entries.length})
      </h3>

      {loading && <p>Ładowanie...</p>}
      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}
      {success && <p style={{ color: "green" }}>Sukces: {success}</p>}

      {/* Formularz dodawania */}
      <form
        onSubmit={handleCreate}
        style={{ display: "flex", marginBottom: "20px" }}
      >
        <input
          type="text"
          value={newEntryName}
          onChange={(e) => setNewEntryName(e.target.value)}
          placeholder={`Dodaj nową ${title.slice(0, -1).toLowerCase()}`}
          style={{ flexGrow: 1, marginRight: "10px" }}
        />
        <button type="submit">Dodaj</button>
      </form>

      {/* Tabela wyświetlająca elementy */}
      {entries.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "15px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #ced4da" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>ID</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Nazwa</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry[idKey]} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>{entry[idKey]}</td>
                <td style={{ padding: "8px" }}>{entry[nameKey]}</td>
                <td style={{ textAlign: "right", padding: "8px" }}>
                  <button
                    onClick={() => handleDelete(entry[idKey], entry[nameKey])}
                    style={{ backgroundColor: "#dc3545", padding: "5px 10px" }}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>Brak zdefiniowanych {title.toLowerCase()}.</p>
      )}
    </div>
  );
};

export default DictionaryTable;
