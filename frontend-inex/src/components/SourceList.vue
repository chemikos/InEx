<script setup lang="ts">
import { useSourceStore } from '@/stores/sourceStore';

const sourceStore = useSourceStore();
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-3 text-green-700">
      Źródła Dochodów ({{ sourceStore.sourceCount }})
    </h3>

    <div v-if="sourceStore.isLoading" class="text-center py-4 text-gray-500">
      Ładowanie źródeł...
    </div>

    <div
      v-else-if="sourceStore.sources.length === 0"
      class="text-center py-4 text-gray-500 border p-2 rounded"
    >
      Brak zdefiniowanych źródeł dochodów dla tego profilu.
    </div>

    <ul v-else class="divide-y divide-gray-200">
      <li
        v-for="source in sourceStore.sources"
        :key="source.id_source"
        class="py-2 flex justify-between items-center"
      >
        <span class="font-medium text-gray-800">{{ source.name }}</span>
        <span class="text-sm text-gray-500"> (ID: {{ source.id_source }})</span>
      </li>
    </ul>
  </div>
</template>
