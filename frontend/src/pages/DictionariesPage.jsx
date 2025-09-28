// /frontend/src/pages/DictionariesPage.jsx
import React, { useState } from "react";
import DictionaryTable from "../components/DictionaryTable";
import { dictionaryApi } from "../api/dictionaries";

// Konfiguracja wszystkich typów słowników
const dictionaryTypes = [
  {
    key: "categories",
    title: "Kategorie wydatków",
    fetchFn: dictionaryApi.fetchCategories,
    createFn: dictionaryApi.createCategory,
    deleteFn: dictionaryApi.deleteCategory,
    idKey: "id_category",
    nameKey: "name",
  },
  {
    key: "items",
    title: "Pozycje wydatków",
    fetchFn: dictionaryApi.fetchItems,
    createFn: dictionaryApi.createItem,
    deleteFn: dictionaryApi.deleteItem,
    idKey: "id_item",
    nameKey: "name",
  },
  {
    key: "labels",
    title: "Etykiety wydatków",
    fetchFn: dictionaryApi.fetchLabels,
    createFn: dictionaryApi.createLabel,
    deleteFn: dictionaryApi.deleteLabel,
    idKey: "id_label",
    nameKey: "name",
  },
  {
    key: "sources",
    title: "Źródła dochodów",
    fetchFn: dictionaryApi.fetchSources,
    createFn: dictionaryApi.createSource,
    deleteFn: dictionaryApi.deleteSource,
    idKey: "id_source",
    nameKey: "name",
  },
];

const DictionariesPage = () => {
  // Domyślnie aktywujemy pierwszy słownik (Kategorie)
  const [activeDictionary, setActiveDictionary] = useState(dictionaryTypes[0]);

  return (
    <div>
      <h1>Słowniki</h1>
      <p>
        Zarządzaj podstawowymi danymi, które pozwalają na kategoryzację wydatków
        i wpłat.
      </p>

      {/* Przełącznik typów słowników (jako zakładki/przyciski) */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        {dictionaryTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => setActiveDictionary(type)}
            // Stylizowanie aktywnego przycisku
            style={{
              backgroundColor:
                activeDictionary.key === type.key ? "#007bff" : "#f8f9fa",
              color: activeDictionary.key === type.key ? "white" : "#007bff",
              border: `1px solid ${
                activeDictionary.key === type.key ? "#007bff" : "#ced4da"
              }`,
              padding: "10px 15px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {type.title}
          </button>
        ))}
      </div>

      {/* Renderowanie aktywnego słownika */}
      <DictionaryTable
        title={activeDictionary.title}
        fetchFn={activeDictionary.fetchFn}
        createFn={activeDictionary.createFn}
        deleteFn={activeDictionary.deleteFn}
        idKey={activeDictionary.idKey}
        nameKey={activeDictionary.nameKey}
      />
    </div>
  );
};

export default DictionariesPage;
