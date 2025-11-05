import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore';

export interface Category {
  id_category: number;
  name: string;
  fk_profile: number;
  items: string[];
  item_ids: number[];
}

export interface NewCategoryData {
  categoryName: string;
  profileId: number;
}
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
  const profileStore = useProfileStore(); // ZMIANA 1: Importujemy verifiedActiveProfileId, który jest strażnikiem
  const { verifiedActiveProfileId } = storeToRefs(profileStore); // --- STATE ---

  const categories = ref<Category[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const categoryCount = computed(() => categories.value.length); // Getter dla listy rozwijanej/wyświetlania, który jest świadomy profilu

  const activeCategories = computed(() => {
    // Kategorie są ładowane tylko dla aktywnego, zweryfikowanego profilu
    if (verifiedActiveProfileId.value === null) {
      return [];
    } // Zwracamy całą listę, ponieważ fetchCategories już filtruje po profilu
    return categories.value;
  }); // --- ACTIONS ---
  /**
   * Pobiera listę kategorii dla danego profilu (GET).
   */

  async function fetchCategories(profileId: number) {
    // ZMIANA 2: Wymuszamy sprawdzenie ID. Jeśli jest null/0, przerywamy.
    if (!profileId) {
      categories.value = [];
      return;
    }
    // console.log('categories.value fetch: ' + categories.value.length); //do wyrzucenia
    isLoading.value = true;
    try {
      const response = await http.get<Category[]>(`/categories?profileId=${profileId}`);
      categories.value = response.data.data;
      // console.log('categories.value fetch try: ' + categories.value.length);  //do wyrzucenia
    } catch (error) {
      console.error(`Błąd podczas pobierania kategorii dla profilu ${profileId}:`, error);
      categories.value = [];
    } finally {
      isLoading.value = false;
    }
  } /**
   * Dodaje nową kategorię (POST).
   */
  async function addCategory(categoryData: NewCategoryData) {
    if (!categoryData.categoryName) throw new Error('Nazwa kategorii jest wymagana.'); // ZMIANA 3: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu

    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || categoryData.profileId !== currentActiveId) {
      throw new Error(
        'Nie można dodać kategorii: Brak aktywnego profilu lub niezgodność ID profilu.',
      );
    }

    try {
      const response = await http.post('/categories', categoryData);
      const data = response.data; // Jeżeli dodanie się powiodło i jest aktywny profil
      const newCategory: Category = {
        id_category: data.categoryId, // Zakładamy, że backend zwraca ID
        name: categoryData.categoryName,
        fk_profile: categoryData.profileId,
        items: [],
        item_ids: [],
      }; // Dodajemy nową kategorię do lokalnego stanu (tylko jeśli jest dla aktywnego profilu)
      categories.value.push(newCategory);
      return { category: newCategory, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Aktualizuje istniejącą kategorię (PUT).
   */
  async function updateCategory(updateData: UpdateCategoryData) {
    // ZMIANA 4: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || updateData.fk_profile !== currentActiveId) {
      throw new Error('Nie można zaktualizować kategorii: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/categories/${updateData.id_category}`; // Wysyłamy zapytanie PUT z nową nazwą

      await http.put(url, { categoryName: updateData.newName, profileId: updateData.fk_profile }); // Aktualizacja stanu lokalnego (tylko jeśli profil się zgadza)

      const categoryToUpdate = categories.value.find(
        (c) => c.id_category === updateData.id_category,
      );
      if (categoryToUpdate) {
        categoryToUpdate.name = updateData.newName;
      }

      return {
        success: true,
        message: `Kategoria z ID ${updateData.id_category} została zaktualizowana na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Usuwa kategorię (DELETE).
   */

  async function deleteCategory(categoryId: number, profileId: number) {
    // ZMIANA 5: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || profileId !== currentActiveId) {
      throw new Error('Nie można usunąć kategorii: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/categories/${categoryId}?profileId=${profileId}`; // Wysyłamy zapytanie DELETE

      await http.delete(url); // Usunięcie ze stanu lokalnego

      categories.value = categories.value.filter((c) => c.id_category !== categoryId);

      return { success: true, message: `Kategoria z ID ${categoryId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    categories,
    activeCategories, // ZWRACAMY NOWY GETTER dla komponentów
    isLoading,
    categoryCount,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
});
