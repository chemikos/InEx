// src/stores/itemStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';

// Definicja typu dla Pozycji Wydatku (Item)
export interface Item {
  id_item: number;
  name: string;
  fk_profile: number;
  labels: string[];
  label_ids: number[];
}

export const useItemStore = defineStore('item', () => {
  // --- STATE ---
  const items = ref<Item[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const itemCount = computed(() => items.value.length);

  // --- ACTIONS ---
  async function fetchItems(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /items?profileId=...
      const response = await http.get(`/items?profileId=${profileId}`);

      // Przyjmujemy, że backend przetworzył labels/label_ids na tablice
      items.value = response.data as Item[];
    } catch (error) {
      console.error(`Błąd podczas pobierania pozycji wydatków dla profilu ${profileId}:`, error);
      items.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Zwrócenie stanu i akcji
  return {
    items,
    isLoading,
    itemCount,
    fetchItems,
  };
});
