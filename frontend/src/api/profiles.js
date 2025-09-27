import apiClient from "./apiClient";

export const fetchProfiles = async () => {
  try {
    const response = await apiClient.get("/profiles");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Nie udało się pobrać profili."
    );
  }
};

export const createProfile = async (profileName) => {
  try {
    const response = await apiClient.post("/profiles", {
      profileName,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Błąd podczas tworzenia profilu."
    );
  }
};
