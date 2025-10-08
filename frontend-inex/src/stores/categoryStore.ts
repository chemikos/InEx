import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore';

// Definicja typu dla Kategorii
export interface Category {
  id_category: number;
  name: string;
  fk_profile: number;
}
export interface NewCategoryData {
  categoryName: string;
  profileId: number;
}
// NOWY TYP DANYCH dla aktualizacji
export interface UpdateCategoryData {
  id_category: number;
  newName: string;
  fk_profile: number;
}

// --- HELPER FUNKCJA DO OBSŁUGI BŁĘDÓW (zgodna z konwencją 'message') ---
function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Używamy pola 'message' zgodnie z Twoją konwencją
    return error.response?.data?.message || `Błąd HTTP ${error.response?.status} podczas operacji.`;
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Nieznany błąd serwera. Sprawdź konsolę.';
}

export const useCategoryStore = defineStore('category', () => {
  const profileStore = useProfileStore();
  // --- STATE ---
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const categoryCount = computed(() => categories.value.length);

  // --- ACTIONS ---

  /**
   * Pobiera listę kategorii dla danego profilu (GET).
   */
  async function fetchCategories(profileId: number) {
    if (!profileId) {
      // Jeśli nie ma ID, resetujemy dane i przerywamy.
      categories.value = [];
      return;
    }
    isLoading.value = true;
    try {
      const response = await http.get<Category[]>(`/categories?profileId=${profileId}`);
      categories.value = response.data;
    } catch (error) {
      console.error(`Błąd podczas pobierania kategorii dla profilu ${profileId}:`, error);
      categories.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // === KLUCZOWA LOGIKA REAKTYWNOŚCI ===
  // Obserwowanie zmiany aktywnego profilu i wywoływanie fetchCategories
  watch(
    () => profileStore.activeProfileId,
    (newId) => {
      // Wywołaj funkcję fetchCategories dla nowego ID (może być null)
      if (newId !== null) {
        fetchCategories(newId);
      } else {
        categories.value = []; // Wyczyść, jeśli nie ma aktywnego profilu
      }
    },
    { immediate: true }, // Uruchom watchera od razu, gdy Store jest inicjowany
  );
  // ===================================

  /**
   * Dodaje nową kategorię (POST).
   */
  async function addCategory(categoryData: NewCategoryData) {
    if (!categoryData.categoryName) throw new Error('Nazwa kategorii jest wymagana.');

    try {
      const response = await http.post('/categories', categoryData);
      const data = response.data;
      // Jeżeli dodanie się powiodło i jest aktywny profil
      if (profileStore.activeProfileId === categoryData.profileId) {
        const newCategory: Category = {
          id_category: data.categoryId, // Zakładamy, że backend zwraca ID
          name: categoryData.categoryName,
          fk_profile: categoryData.profileId,
        };
        // Dodajemy nową kategorię do lokalnego stanu
        categories.value.push(newCategory);
        return { category: newCategory, message: data.message };
      }

      return { category: null, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Aktualizuje istniejącą kategorię (PUT).
   */

  async function updateCategory(updateData: UpdateCategoryData) {
    try {
      const url = `/categories/${updateData.id_category}`; // Wysyłamy zapytanie PUT z nową nazwą

      await http.put(url, { categoryName: updateData.newName, profileId: updateData.fk_profile }); // Aktualizacja stanu lokalnego (tylko jeśli profil się zgadza)

      if (profileStore.activeProfileId === updateData.fk_profile) {
        const categoryToUpdate = categories.value.find(
          (c) => c.id_category === updateData.id_category,
        );
        if (categoryToUpdate) {
          categoryToUpdate.name = updateData.newName;
        }
      }

      return {
        success: true,
        message: `Kategoria z ID ${updateData.id_category} została zaktualizowana na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Usuwa kategorię (DELETE).
   */
  async function deleteCategory(categoryId: number, profileId: number) {
    try {
      const url = `/categories/${categoryId}?profileId=${profileId}`;

      // Wysyłamy zapytanie DELETE
      await http.delete(url);

      // Usunięcie ze stanu lokalnego
      categories.value = categories.value.filter((c) => c.id_category !== categoryId);

      return { success: true, message: `Kategoria z ID ${categoryId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // Zwrócenie stanu i akcji
  return {
    categories,
    isLoading,
    categoryCount,
    fetchCategories,
    addCategory,
    updateCategory, // NOWA METODA
    deleteCategory, // NOWA METODA
  };
});
