// src/stores/itemStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

// Definicja typu dla Pozycji Wydatku (Item)
export interface Item {
  id_item: number;
  name: string;
  fk_profile: number;
  category_name: string;
  fk_category: number;
  labels: string[];
  label_ids: number[];
}
export interface NewItemData {
  profileId: number;
  itemName: string;
  categoryId: number;
  labelIds: number[];
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

  async function addItem(itemData: NewItemData) {
    if (!itemData.itemName || !itemData.categoryId) {
      throw new Error('Nazwa pozycji i kategoria są wymagane.');
    }

    try {
      const response = await http.post('/items', itemData);
      const data = response.data;

      const newItemId = data.itemId;
      const successMessage = data.message;

      // Tworzymy uproszczony obiekt na podstawie danych wejściowych
      // (zakładamy, że Store Kategorii/Etykiet nie są dostępne, więc używamy IDs)
      const newItem: Item = {
        id_item: newItemId,
        name: itemData.itemName,
        fk_profile: itemData.profileId,
        fk_category: itemData.categoryId,
        category_name: 'Nieznana (przeładuj)', // Placeholder
        labels: [], // Placeholder
        label_ids: itemData.labelIds,
      };

      // Dodajemy nową pozycję do lokalnego stanu
      items.value.push(newItem);

      console.log(`Pomyślnie dodano pozycję wydatku: ${itemData.itemName}`);

      // Zwracamy obiekt z pełnym komunikatem sukcesu
      return { item: newItem, message: successMessage };
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
    items,
    isLoading,
    itemCount,
    fetchItems,
    addItem,
  };
});
