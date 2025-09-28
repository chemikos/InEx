// /frontend/src/api/dictionaries.js
import apiClient from "./apiClient";

// --- Funkcje Generyczne (wewnętrzne) ---
const fetchDictionary = async (endpoint, profileId) => {
  if (!profileId) throw new Error("Brak wybranego ID profilu.");
  try {
    // GET /api/[endpoint]?profileId=X
    const response = await apiClient.get(`/${endpoint}`, {
      params: { profileId },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || `Nie udało się pobrać ${endpoint}.`
    );
  }
};

const createDictionaryEntry = async (endpoint, profileId, name) => {
  if (!profileId) throw new Error("Brak wybranego ID profilu.");
  try {
    const payload = {
      profileId,
      // Automatyczne dopasowanie do nazwy pola, jakiej oczekuje backend (np. categoryName)
      [`${endpoint.slice(0, -1)}Name`]: name,
    };
    const response = await apiClient.post(`/${endpoint}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        `Błąd podczas tworzenia ${endpoint}.`
    );
  }
};

const deleteDictionaryEntry = async (endpoint, profileId, id) => {
  if (!profileId) throw new Error("Brak wybranego ID profilu.");
  try {
    // DELETE /api/[endpoint]/:id?profileId=X
    await apiClient.delete(`/${endpoint}/${id}`, { params: { profileId } });
    return { success: true };
  } catch (error) {
    // Backend używa 409 w przypadku konfliktu (np. kategoria jest powiązana z wydatkiem)
    if (error.response?.status === 409) {
      throw new Error(error.response.data.message);
    }
    throw new Error(
      error.response?.data?.message || `Błąd podczas usuwania ${endpoint}.`
    );
  }
};

// --- Eksportowane funkcje API ---
export const dictionaryApi = {
  // Kategorie
  fetchCategories: (profileId) => fetchDictionary("categories", profileId),
  createCategory: (profileId, name) =>
    createDictionaryEntry("categories", profileId, name),
  deleteCategory: (profileId, id) =>
    deleteDictionaryEntry("categories", profileId, id),

  // Pozycje wydatków
  fetchItems: (profileId) => fetchDictionary("items", profileId),
  createItem: (profileId, name) =>
    createDictionaryEntry("items", profileId, name),
  deleteItem: (profileId, id) => deleteDictionaryEntry("items", profileId, id),

  // Etykiety
  fetchLabels: (profileId) => fetchDictionary("labels", profileId),
  createLabel: (profileId, name) =>
    createDictionaryEntry("labels", profileId, name),
  deleteLabel: (profileId, id) =>
    deleteDictionaryEntry("labels", profileId, id),

  // Źródła dochodów
  fetchSources: (profileId) => fetchDictionary("sources", profileId),
  createSource: (profileId, name) =>
    createDictionaryEntry("sources", profileId, name),
  deleteSource: (profileId, id) =>
    deleteDictionaryEntry("sources", profileId, id),
};
