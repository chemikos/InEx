// src/stores/itemStore.ts

import { defineStore, storeToRefs } from 'pinia'; // Dodano storeToRefs
import { ref, computed } from 'vue';
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
  const profileStore = useProfileStore(); // ZMIANA 1: Używamy storeToRefs do uzyskania reaktywnego, zweryfikowanego ID
  const { verifiedActiveProfileId } = storeToRefs(profileStore); // --- STATE ---

  const items = ref<Item[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const itemCount = computed(() => items.value.length); // ZMIANA 2: Nowy getter, który zwraca listę pozycji tylko, jeśli profil jest zweryfikowany
  const activeItems = computed(() => {
    if (verifiedActiveProfileId.value === null) {
      return [];
    }
    return items.value;
  }); // --- ACTIONS ---
  /**
   * Pobiera listę pozycji wydatków dla danego profilu (GET).
   */

  async function fetchItems(profileId: number) {
    // ZMIANA 3: Wymuszamy sprawdzenie ID. Jeśli jest null/0, resetujemy dane i przerywamy.
    if (!profileId) {
      items.value = [];
      return;
    } // Dodatkowe zabezpieczenie: Upewnij się, że profil jest aktualnie aktywny

    if (profileId !== verifiedActiveProfileId.value) {
      console.warn(
        'Próba pobrania pozycji wydatków dla nieaktywnego lub niezsynchronizowanego profilu.',
      );
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
  } /**
   * Dodaje nową pozycję (POST).
   */

  async function addItem(itemData: NewItemData) {
    if (!itemData.itemName || !itemData.categoryId) {
      throw new Error('Nazwa pozycji i kategoria są wymagane.');
    } // ZMIANA 4: Zabezpieczenie: Tylko dla aktywnego, zweryfikowanego profilu

    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || itemData.profileId !== currentActiveId) {
      throw new Error('Nie można dodać pozycji: Niezgodność ID aktywnego profilu.');
    }

    try {
      const response = await http.post('/items', itemData);
      const data = response.data; // Jeżeli dodanie się powiodło
      const newItem: Item = {
        id_item: data.itemId, // Zakładamy, że backend zwraca ID
        name: itemData.itemName,
        fk_profile: itemData.profileId,
        fk_category: itemData.categoryId,
        category_name: 'Nieznana (przeładuj)', // Placeholder
        labels: [], // Placeholder
        label_ids: itemData.labelIds,
      }; // Dodajemy nową pozycję do lokalnego stanu
      items.value.push(newItem);
      return { item: newItem, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Aktualizuje istniejącą pozycję (PUT).
   */

  async function updateItem(updateData: UpdateItemData) {
    // ZMIANA 5: Zabezpieczenie: Tylko dla aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || updateData.fk_profile !== currentActiveId) {
      throw new Error('Nie można zaktualizować pozycji: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/items/${updateData.id_item}`; // WYSYŁANIE ZGODNE Z TWOJĄ KONWENCJĄ: profileId, itemName, categoryId, labelIds w body

      await http.put(url, {
        profileId: updateData.fk_profile,
        itemName: updateData.newName,
        categoryId: updateData.fk_category, // Wymagane
        labelIds: updateData.label_ids || [], // Opcjonalne
      }); // Aktualizacja stanu lokalnego

      const itemToUpdate = items.value.find((i) => i.id_item === updateData.id_item);
      if (itemToUpdate) {
        // Aktualizujemy dane
        itemToUpdate.name = updateData.newName;
        itemToUpdate.fk_category = updateData.fk_category;
        itemToUpdate.label_ids = updateData.label_ids; // W idealnym świecie backend zwróciłby category_name i labels, ale na razie używamy dostarczonych ID
        // Lepszym rozwiązaniem byłoby wymusić przeładowanie wszystkich Items (fetchItems) po udanej edycji,
        // aby mieć pewność, że wszystkie nazwy (kategorii i etykiet) są aktualne.
      }

      return {
        success: true,
        message: `Pozycja z ID ${updateData.id_item} została zaktualizowana na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Usuwa pozycję wydatków (DELETE).
   */

  async function deleteItem(itemId: number, profileId: number) {
    // ZMIANA 6: Zabezpieczenie: Tylko dla aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || profileId !== currentActiveId) {
      throw new Error('Nie można usunąć pozycji: Niezgodność ID aktywnego profilu.');
    }

    try {
      // WYSYŁANIE ZGODNE Z KONWENCJĄ: profileId w query stringu
      const url = `/items/${itemId}?profileId=${profileId}`;

      await http.delete(url); // Usunięcie ze stanu lokalnego

      items.value = items.value.filter((i) => i.id_item !== itemId);

      return { success: true, message: `Pozycja z ID ${itemId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    items,
    activeItems, // Nowy bezpieczny getter
    isLoading,
    itemCount,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  };
});
