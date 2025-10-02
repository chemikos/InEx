<script setup lang="ts">
import { useLabelStore } from '@/stores/labelStore';

const labelStore = useLabelStore();
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-3 text-green-700">
      Etykiety ({{ labelStore.labelCount }})
    </h3>

    <div v-if="labelStore.isLoading" class="text-center py-4 text-gray-500">
      Ładowanie etkiet...
    </div>

    <div
      v-else-if="labelStore.labels.length === 0"
      class="text-center py-4 text-gray-500 border p-2 rounded"
    >
      Brak zdefiniowanych etykiet dla tego profilu.
    </div>

    <ul v-else class="divide-y divide-gray-200">
      <li
        v-for="label in labelStore.labels"
        :key="label.id_label"
        class="py-2 flex justify-between items-center"
      >
        <span class="font-medium text-gray-800">{{ label.name }}</span>
        <span class="text-sm text-gray-500"> (ID: {{ label.id_label }})</span>
      </li>
    </ul>
  </div>
</template>
