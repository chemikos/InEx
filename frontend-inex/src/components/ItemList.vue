<script setup lang="ts">
import { ref } from 'vue';
import { useItemStore } from '@/stores/itemStore';

const itemStore = useItemStore();

// --- STAN EDYCJI ---
const editingItemId = ref<number | null>(null);
const tempItemName = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

/**
 * Rozpoczyna tryb edycji dla nazwy pozycji.
 */
const startEdit = (id: number, currentName: string) => {
  message.value = { text: '', type: null };
  editingItemId.value = id;
  tempItemName.value = currentName;
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingItemId.value = null;
  tempItemName.value = '';
  message.value = { text: '', type: null };
};

/**
 * Zapisuje zaktualizowaną nazwę pozycji (PUT).
 */
const saveEdit = async (itemId: number, profileId: number) => {
  const newName = tempItemName.value.trim();
  // 1. POBIERAMY PEŁNY OBIEKT POZYCJI
  const currentItem = itemStore.items.find((i) => i.id_item === itemId);

  if (!currentItem) return;

  if (!newName) {
    message.value = { text: 'Nazwa pozycji nie może być pusta.', type: 'error' };
    return;
  }

  if (newName === currentItem.name) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    // 2. PRZEKAZUJEMY WSZYSTKIE WYMAGANE POLA DO STORE'A
    const result = await itemStore.updateItem({
      id_item: itemId,
      newName: newName,
      fk_profile: profileId,
      // PRAWIDŁOWE POLA DLA ZAPYTANIA PUT:
      fk_category: currentItem.fk_category, // Wartość z aktualnego stanu
      label_ids: currentItem.label_ids, // Wartość z aktualnego stanu
    });

    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie pozycji (DELETE).
 */
const confirmDelete = async (itemId: number, itemName: string, profileId: number) => {
  if (
    !confirm(
      `Czy na pewno chcesz usunąć pozycję wydatków: "${itemName}"? Ta operacja jest nieodwracalna!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await itemStore.deleteItem(itemId, profileId);

    // Sukces jest obsługiwany przez Pinia Store
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

    <div v-if="itemStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie pozycji wydatków...
    </div>

    <div v-else-if="itemStore.items.length > 0" class="overflow-x-auto">
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
          <tr v-for="item in itemStore.items" :key="item.id_item" class="table-row item-row-hover">
            <td class="table-cell">{{ item.id_item }}</td>

            <td class="table-cell font-medium">
              <template v-if="editingItemId === item.id_item">
                <input
                  type="text"
                  v-model="tempItemName"
                  @keyup.enter="saveEdit(item.id_item, item.fk_profile)"
                  class="form-input"
                  style="width: 90%; padding: 0.3rem"
                />
              </template>
              <template v-else>
                {{ item.name }}
              </template>
            </td>

            <td class="table-cell font-medium">{{ item.category_name }}</td>
            <td class="table-cell">
              <span v-for="label in item.labels" :key="label" class="item-label-badge">
                {{ label }}
              </span>
            </td>

            <td class="table-cell actions-cell">
              <template v-if="editingItemId === item.id_item">
                <button
                  @click="saveEdit(item.id_item, item.fk_profile)"
                  class="btn-action btn-edit-save mr-2"
                >
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(item.id_item, item.name)"
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
