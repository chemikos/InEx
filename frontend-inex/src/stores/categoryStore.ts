// src/stores/categoryStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';

// Definicja typu dla Kategorii
export interface Category {
  id_category: number;
  name: string;
  fk_profile: number;
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

  // Zwrócenie stanu i akcji
  return {
    categories,
    isLoading,
    categoryCount,
    fetchCategories,
  };
});
