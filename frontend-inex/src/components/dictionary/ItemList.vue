<script setup lang="ts">
import { ref, watch } from 'vue';
import { useItemStore, type Item } from '@/stores/itemStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useLabelStore } from '@/stores/labelStore';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profileStore';

const itemStore = useItemStore();
const categoryStore = useCategoryStore();
const labelStore = useLabelStore();
const profileStore = useProfileStore();

// --- POBIERANIE BEZPIECZNYCH DANYCH ---
// Zastępujemy 'activeProfileId' bezpieczniejszym 'verifiedActiveProfileId'
const { verifiedActiveProfileId, isProfileStoreReady } = storeToRefs(profileStore);
// Przyjmujemy, że te gettery lub refy dostarczają dane dla aktywnego profilu
const { items: activeItems, isLoading } = storeToRefs(itemStore);
const { activeCategories } = storeToRefs(categoryStore);
const { activeLabels } = storeToRefs(labelStore);

// --- FUNKCJA POBIERANIA DANYCH ---
const loadData = (id: number | null | undefined) => {
  if (id !== null && id !== undefined) {
    // Wywołujemy funkcję fetch z aktualnym ZWERYFIKOWANYM ID
    itemStore.fetchItems(id);
  } else {
    // Czyścimy listę, jeśli profil jest nieaktywny
    itemStore.items = []; // Czyścimy ref w store
  }
};

// === GŁÓWNA REAKTYWNOŚĆ: ===
// Reagujemy na zmianę ZWERYFIKOWANEGO ID profilu
watch(
  verifiedActiveProfileId,
  (newId) => {
    loadData(newId);
  },
  {
    immediate: true, // Powoduje pierwsze ładowanie po montażu
  },
);

// --- USUWANIE MOCKÓW I REDUNDANTNEGO FETCHOWANIA DANYCH SŁOWNIKOWYCH ---
// Usunięto MOCK_PROFILE_ID i ręczne fetchCategories/fetchLabels.
// Zakładamy, że CategoryList/LabelList/AddItemForm wymusza ich załadowanie.

// --- STAN PEŁNEJ EDYCJI ---
const editingItemId = ref<number | null>(null);
const tempItemName = ref('');
const editingCategoryRef = ref<number | null>(null);
const editingLabelsRef = ref<number[]>([]);

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// --- STAN MODALA USUWANIA (Zastąpienie window.confirm) ---
const isDeleteModalOpen = ref(false);
const itemToDelete = ref<{ id: number; name: string; profileId: number } | null>(null);

const openDeleteModal = (itemId: number, itemName: string, profileId: number) => {
  itemToDelete.value = { id: itemId, name: itemName, profileId };
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  itemToDelete.value = null;
};

/**
 * Rozpoczyna tryb edycji, ustawiając wszystkie edytowalne wartości.
 */
const startEdit = (item: Item) => {
  message.value = { text: '', type: null };
  editingItemId.value = item.id_item;
  tempItemName.value = item.name;
  editingCategoryRef.value = item.fk_category;
  editingLabelsRef.value = [...item.label_ids]; // Kopiujemy tablicę, aby unikać mutacji
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingItemId.value = null;
  tempItemName.value = '';
  editingCategoryRef.value = null;
  editingLabelsRef.value = [];
  message.value = { text: '', type: null };
};

/**
 * Zapisuje zaktualizowane dane pozycji (PUT).
 */
const saveEdit = async (item: Item) => {
  const newName = tempItemName.value.trim();
  const newCategoryId = editingCategoryRef.value;
  const newLabelIds = editingLabelsRef.value;

  if (!newName || !newCategoryId) {
    message.value = { text: 'Nazwa pozycji i kategoria są wymagane.', type: 'error' };
    return;
  } // Sprawdzenie, czy faktycznie coś się zmieniło, aby uniknąć niepotrzebnego zapytania

  const isNameChanged = newName !== item.name;
  const isCategoryChanged = newCategoryId !== item.fk_category;
  const areLabelsChanged =
    newLabelIds.length !== item.label_ids.length ||
    newLabelIds.some((id) => !item.label_ids.includes(id));

  if (!isNameChanged && !isCategoryChanged && !areLabelsChanged) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const result = await itemStore.updateItem({
      id_item: item.id_item,
      newName: newName,
      fk_profile: item.fk_profile,
      fk_category: newCategoryId, // Nowe ID kategorii
      label_ids: newLabelIds, // Nowe ID etykiet
    }); // Ręczna aktualizacja stanu lokalnego, by natychmiast zobaczyć zmiany

    const itemToUpdate = itemStore.items.find((i) => i.id_item === item.id_item);
    if (itemToUpdate) {
      itemToUpdate.name = newName;
      itemToUpdate.fk_category = newCategoryId;
      itemToUpdate.label_ids = newLabelIds; // Aktualizacja nazw dla wyświetlania w tabeli (tylko dla spójności UI)
      itemToUpdate.category_name =
        activeCategories.value.find((c) => c.id_category === newCategoryId)?.name || 'N/A';
      itemToUpdate.labels = activeLabels.value
        .filter((l) => newLabelIds.includes(l.id_label))
        .map((l) => l.name);
    }

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie pozycji (DELETE) przez otwarcie modala.
 */
const confirmDelete = (itemId: number, itemName: string, profileId: number) => {
  openDeleteModal(itemId, itemName, profileId);
};

/**
 * Wykonuje faktyczne usuwanie po potwierdzeniu w modal.
 */
const executeDelete = async () => {
  if (!itemToDelete.value) return;

  const { id: itemId, profileId } = itemToDelete.value;

  message.value = { text: 'Trwa usuwanie...', type: null };
  closeDeleteModal(); // Zamknij modal natychmiast po rozpoczęciu operacji

  try {
    const result = await itemStore.deleteItem(itemId, profileId);
    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div class="table-container item-list-container">
    <h3 class="form-title item-title-border">Pozycje Wydatków (Items)</h3>
    <div
      v-if="message.text"
      :class="{
        'bg-green-100 border-green-400 text-green-700': message.type === 'success',
        'bg-red-100 border-red-400 text-red-700': message.type === 'error',
      }"
      class="p-3 border rounded-md mb-4 text-sm"
    >
      {{ message.text }}
    </div>
    <p class="item-summary-box">
      Liczba pozycji w bazie:
      <span class="item-summary-amount">{{ itemStore.itemCount }}</span>
    </p>
    <div
      v-if="!isProfileStoreReady || verifiedActiveProfileId === null"
      class="text-center p-8 bg-yellow-50 text-yellow-700 rounded-md"
    >
      Oczekiwanie na aktywny profil lub ładowanie danych.
    </div>
    <div v-else-if="isLoading" class="text-center p-8 text-gray-500">
      Ładowanie pozycji wydatków...
    </div>
    <div v-else-if="activeItems.length > 0" class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">ID</th>
            <th class="table-header">Nazwa Pozycji</th>
            <th class="table-header">Nazwa Kategorii</th>
            <th class="table-header">Etykiety</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <!-- Używamy activeItems (poprawnie załadowanych danych) -->
          <tr v-for="item in activeItems" :key="item.id_item" class="table-row item-row-hover">
            <td class="table-cell">{{ item.id_item }}</td>
            <td class="table-cell font-medium">
              <template v-if="editingItemId === item.id_item">
                <input
                  type="text"
                  v-model="tempItemName"
                  @keyup.enter="saveEdit(item)"
                  class="form-input"
                  style="width: 90%; padding: 0.3rem"
                />
              </template>
              <template v-else> {{ item.name }} </template>
            </td>
            <td class="table-cell font-medium">
              <template v-if="editingItemId === item.id_item">
                <!-- Używamy activeCategories dla edycji -->
                <select v-model="editingCategoryRef" class="form-select" style="padding: 0.3rem">
                  <option
                    v-for="cat in activeCategories"
                    :key="cat.id_category"
                    :value="cat.id_category"
                  >
                    {{ cat.name }}
                  </option>
                </select>
              </template>
              <template v-else> {{ item.category_name }} </template>
            </td>
            <td class="table-cell">
              <template v-if="editingItemId === item.id_item">
                <!-- Używamy activeLabels dla edycji -->
                <select
                  multiple
                  v-model="editingLabelsRef"
                  class="form-select"
                  style="height: 60px"
                >
                  <option
                    v-for="label in activeLabels"
                    :key="label.id_label"
                    :value="label.id_label"
                  >
                    {{ label.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                <span v-for="label in item.labels" :key="label" class="item-label-badge">
                  {{ label }}
                </span>
              </template>
            </td>
            <td class="table-cell actions-cell">
              <template v-if="editingItemId === item.id_item">
                <button @click="saveEdit(item)" class="btn-action btn-edit-save mr-2">
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(item)"
                  class="btn-action btn-edit mr-2"
                  :disabled="!!editingItemId"
                >
                  Edytuj
                </button>
                <button
                  @click="confirmDelete(item.id_item, item.name, item.fk_profile)"
                  class="btn-action btn-delete"
                  :disabled="!!editingItemId"
                >
                  Usuń
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-4 text-gray-500 border p-3 rounded">
      Brak zdefiniowanych pozycji wydatków dla tego profilu.
    </div>
    <!-- MODAL POTWIERDZENIA USUNIĘCIA (Zastępuje window.confirm) -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border-t-4 border-red-500">
        <h4 class="text-xl font-bold mb-3 text-gray-800">Potwierdź Usunięcie</h4>
        <p class="text-gray-600 mb-6">
          Czy na pewno chcesz usunąć pozycję:
          <span class="font-semibold text-red-600">"{{ itemToDelete?.name }}"</span>? Ta operacja
          jest nieodwracalna!
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="closeDeleteModal"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-150"
          >
            Anuluj
          </button>
          <button
            @click="executeDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
          >
            Usuń
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Lokalny kontener, aby zachować unikalny margin-top */
.item-list-container {
  margin-top: 1.5rem;
}

/* Tytuł i obramowanie */
.item-title-border {
  color: #b91c1c; /* red-700 (z oryginalnego kodu) */
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem; /* text-2xl z oryginalnego kodu */
}

/* Sekcja Sumaryczna (Indygo) */
.item-summary-box {
  /* p-3 bg-indigo-50 rounded */
  padding: 0.75rem;
  background-color: #eef2ff; /* indigo-50 */
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem; /* text-lg */
}

.item-summary-amount {
  font-weight: 700;
  color: #4f46e5; /* indigo-700 */
}

/* Wiersz po najechaniu myszą (hover) */
.item-row-hover:hover {
  background-color: #f7fafc !important; /* Lekkie podświetlenie */
}

/* Styl dla Etykiet (Labels) - Odwzorowanie oryginalnych klas (Pink) */
.item-label-badge {
  /* inline-block bg-pink-100 text-pink-800 text-xs font-semibold mr-1 px-2.5 py-0.5 rounded-full */
  display: inline-block;
  background-color: #fce7f3; /* pink-100 */
  color: #9d174d; /* pink-800 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  margin-right: 0.25rem;
  padding: 2px 10px;
  border-radius: 9999px; /* rounded-full */
  white-space: nowrap;
}
</style>
