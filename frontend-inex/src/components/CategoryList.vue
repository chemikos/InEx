<script setup lang="ts">
import { useCategoryStore } from '@/stores/categoryStore';

const categoryStore = useCategoryStore();

const editCategory = (id: number) => {
  console.log(`Edycja Kategorii ID: ${id}`);
  alert(`Edycja Kategorii ID: ${id} (W BUDOWIE)`);
};

const deleteCategory = (id: number) => {
  console.log(`Usuwanie Kategorii ID: ${id}`);
  if (confirm(`Czy na pewno chcesz usunąć Kategorię ID: ${id}?`)) {
    // Logika delete (do zaimplementowania w Pinia Store później)
    alert(`Kategoria ID: ${id} usunięta! (W BUDOWIE)`);
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Kategorii</h2>
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
            <td class="table-cell">{{ category.name }}</td>
            <td class="table-cell actions-cell">
              <button @click="editCategory(category.id_category)" class="btn-action btn-edit">
                Edytuj
              </button>
              <button @click="deleteCategory(category.id_category)" class="btn-action btn-delete">
                Usuń
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
