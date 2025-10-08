// src/stores/itemStore.ts

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore';

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
// NOWY TYP DANYCH dla aktualizacji
export interface UpdateItemData {
  id_item: number;
  newName: string;
  fk_profile: number;
  fk_category: number;
  label_ids: number[];
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

export const useItemStore = defineStore('item', () => {
  const profileStore = useProfileStore();
  // --- STATE ---
  const items = ref<Item[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const itemCount = computed(() => items.value.length); // --- ACTIONS ---

  async function fetchItems(profileId: number) {
    if (!profileId) {
      // Jeśli nie ma ID, resetujemy dane i przerywamy.
      items.value = [];
      return;
    }
    isLoading.value = true;
    try {
      const response = await http.get(`/items?profileId=${profileId}`);
      items.value = response.data as Item[];
    } catch (error) {
      console.error(`Błąd podczas pobierania pozycji wydatków dla profilu ${profileId}:`, error);
      items.value = [];
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
        fetchItems(newId);
      } else {
        items.value = []; // Wyczyść, jeśli nie ma aktywnego profilu
      }
    },
    { immediate: true }, // Uruchom watchera od razu, gdy Store jest inicjowany
  );
  // ===================================

  async function addItem(itemData: NewItemData) {
    if (!itemData.itemName || !itemData.categoryId) {
      throw new Error('Nazwa pozycji i kategoria są wymagane.');
    }

    try {
      // const response = await http.post('/items', itemData);
      // const data = response.data; // Backend prawdopodobnie zwróciłby pełny obiekt z nazwami,
      // // ale na potrzeby szybkiego dodania do stanu użyjemy Twojego mocka

      // const newItem: Item = {
      //   id_item: data.itemId,
      //   name: itemData.itemName,
      //   fk_profile: itemData.profileId,
      //   fk_category: itemData.categoryId,
      //   category_name: 'Nieznana (przeładuj)', // Placeholder
      //   labels: [], // Placeholder
      //   label_ids: itemData.labelIds,
      // };

      // items.value.push(newItem);
      // return { item: newItem, message: data.message };

      const response = await http.post('/items', itemData);
      const data = response.data;
      // Jeżeli dodanie się powiodło i jest aktywny profil
      if (profileStore.activeProfileId === itemData.profileId) {
        const newItem: Item = {
          id_item: data.itemId, // Zakładamy, że backend zwraca ID
          name: itemData.itemName,
          fk_profile: itemData.profileId,
          fk_category: itemData.categoryId,
          category_name: 'Nieznana (przeładuj)', // Placeholder
          labels: [], // Placeholder
          label_ids: itemData.labelIds,
        };
        // Dodajemy nową kategorię do lokalnego stanu
        items.value.push(newItem);
        return { item: newItem, message: data.message };
      }

      return { item: null, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Aktualizuje istniejącą pozycję (PUT) - Zmiana tylko Nazwy.
   * UWAGA: Pełna edycja wymagałaby przekazania kategorii i etykiet.
   */
  async function updateItem(updateData: UpdateItemData) {
    try {
      const url = `/items/${updateData.id_item}`;

      // WYSYŁANIE ZGODNE Z TWOJĄ KONWENCJĄ: profileId, itemName, categoryId, labelIds w body
      await http.put(url, {
        profileId: updateData.fk_profile,
        itemName: updateData.newName,
        categoryId: updateData.fk_category, // Wymagane
        labelIds: updateData.label_ids || [], // Opcjonalne
      });

      // Aktualizacja stanu lokalnego
      if (profileStore.activeProfileId === updateData.fk_profile) {
        const itemToUpdate = items.value.find((i) => i.id_item === updateData.id_item);
        if (itemToUpdate) {
          // Aktualizujemy tylko zmienioną nazwę
          itemToUpdate.name = updateData.newName;

          // **UWAGA:** Jeśli edycja pozycji miałaby zmieniać kategorię/etykiety,
          // musielibyśmy tu aktualizować również category_name, labels, fk_category i label_ids
          // na podstawie danych zwróconych przez backend (lub użyć tu danych z updateData).
          // Na potrzeby edycji inline nazwy, ta zmiana jest wystarczająca.
        }
      }

      return {
        success: true,
        message: `Nazwa pozycji z ID ${updateData.id_item} została zaktualizowana na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Usuwa pozycję wydatków (DELETE).
   */
  async function deleteItem(itemId: number, profileId: number) {
    try {
      // WYSYŁANIE ZGODNE Z KONWENCJĄ: profileId w query stringu
      const url = `/items/${itemId}?profileId=${profileId}`;

      await http.delete(url);

      // Usunięcie ze stanu lokalnego
      items.value = items.value.filter((i) => i.id_item !== itemId);

      return { success: true, message: `Pozycja z ID ${itemId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    items,
    isLoading,
    itemCount,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  };
});
