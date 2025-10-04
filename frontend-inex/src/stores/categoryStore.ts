// src/stores/categoryStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

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

export const useCategoryStore = defineStore('category', () => {
  // --- STATE ---
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const categoryCount = computed(() => categories.value.length);

  // --- ACTIONS ---
  async function fetchCategories(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /categories?profileId=...
      const response = await http.get(`/categories?profileId=${profileId}`);

      categories.value = response.data as Category[];
    } catch (error) {
      console.error(`Błąd podczas pobierania kategorii dla profilu ${profileId}:`, error);
      categories.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function addCategory(categoryData: NewCategoryData) {
    if (!categoryData.categoryName) throw new Error('Nazwa kategorii jest wymagana.');

    try {
      const response = await http.post('/categories', categoryData);
      const data = response.data;

      const newCategoryId = data.categoryId;
      const successMessage = data.message;

      // Tworzymy uproszczony obiekt na podstawie danych wejściowych
      const newCategory: Category = {
        id_category: newCategoryId,
        name: categoryData.categoryName,
        fk_profile: categoryData.profileId,
      };

      // Dodajemy nową kategorię do lokalnego stanu
      categories.value.push(newCategory);

      console.log(`Pomyślnie dodano kategorię: ${categoryData.categoryName}`);

      // Zwracamy obiekt z pełnym komunikatem sukcesu
      return { category: newCategory, message: successMessage };
    } catch (error) {
      let errorMessage: string = 'Nieznany błąd serwera. Sprawdź konsolę.';

      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || `Błąd HTTP ${error.response?.status}.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Rzucamy błąd dalej
      throw new Error(errorMessage);
    }
  }

  // Zwrócenie stanu i akcji
  return {
    categories,
    isLoading,
    categoryCount,
    fetchCategories,
    addCategory,
  };
});
