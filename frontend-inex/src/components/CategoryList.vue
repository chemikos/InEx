<script setup lang="ts">
import { ref } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';

const categoryStore = useCategoryStore();

// --- STAN EDYCJI ---
// ID kategorii, która jest obecnie edytowana
const editingCategoryId = ref<number | null>(null);
// Tymczasowa nazwa używana w polu input podczas edycji
const tempCategoryName = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

/**
 * Rozpoczyna tryb edycji dla danej kategorii.
 */
const startEdit = (id: number, currentName: string) => {
  message.value = { text: '', type: null };
  editingCategoryId.value = id;
  tempCategoryName.value = currentName;
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingCategoryId.value = null;
  tempCategoryName.value = '';
};

/**
 * Zapisuje zaktualizowaną nazwę kategorii (PUT).
 */
const saveEdit = async (categoryId: number, profileId: number) => {
  const newName = tempCategoryName.value.trim();

  if (!newName) {
    message.value = { text: 'Nazwa kategorii nie może być pusta.', type: 'error' };
    return;
  }

  if (newName === categoryStore.categories.find((c) => c.id_category === categoryId)?.name) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const result = await categoryStore.updateCategory({
      id_category: categoryId,
      newName,
      fk_profile: profileId,
    });

    // Sukces jest obsługiwany przez Pinia Store
    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie kategorii (DELETE).
 */
const confirmDelete = async (categoryId: number, categoryName: string, profileId: number) => {
  if (
    !confirm(
      `Czy na pewno chcesz usunąć kategorię: "${categoryName}"? Spowoduje to usunięcie powiązanych transakcji!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await categoryStore.deleteCategory(categoryId, profileId);

    // Sukces jest obsługiwany przez Pinia Store
    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Kategorii</h2>

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

    <div v-if="categoryStore.isLoading" class="p-4 text-center">Ładowanie kategorii...</div>

    <div
      v-else-if="categoryStore.categories.length === 0"
      class="p-4 text-center bg-gray-50 rounded-md"
    >
      Brak zdefiniowanych kategorii dla tego profilu.
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">Nazwa</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="category in categoryStore.categories"
            :key="category.id_category"
            class="table-row"
          >
            <td class="table-cell">
              <template v-if="editingCategoryId === category.id_category">
                <input
                  type="text"
                  v-model="tempCategoryName"
                  @keyup.enter="saveEdit(category.id_category, category.fk_profile)"
                  class="form-input"
                  style="width: 90%; padding: 0.3rem"
                />
              </template>
              <template v-else>
                {{ category.name }}
              </template>
            </td>

            <td class="table-cell actions-cell">
              <template v-if="editingCategoryId === category.id_category">
                <button
                  @click="saveEdit(category.id_category, category.fk_profile)"
                  class="btn-action btn-edit-save mr-2"
                >
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(category.id_category, category.name)"
                  class="btn-action btn-edit mr-2"
                >
                  Edytuj
                </button>
                <button
                  @click="confirmDelete(category.id_category, category.name, category.fk_profile)"
                  class="btn-action btn-delete"
                >
                  Usuń
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
