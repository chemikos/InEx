<script setup lang="ts">
import { useCategoryStore } from '@/stores/categoryStore';

const categoryStore = useCategoryStore();
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-3 text-green-700">
      Kategorie ({{ categoryStore.categoryCount }})
    </h3>

    <div v-if="categoryStore.isLoading" class="text-center py-4 text-gray-500">
      Ładowanie kategorii...
    </div>

    <div
      v-else-if="categoryStore.categories.length === 0"
      class="text-center py-4 text-gray-500 border p-2 rounded"
    >
      Brak zdefiniowanych kategorii dla tego profilu.
    </div>

    <ul v-else class="divide-y divide-gray-200">
      <li
        v-for="category in categoryStore.categories"
        :key="category.id_category"
        class="py-2 flex justify-between items-center"
      >
        <span class="font-medium text-gray-800">{{ category.name }}</span>
        <span class="text-sm text-gray-500"> (ID: {{ category.id_category }})</span>
      </li>
    </ul>
  </div>
</template>
