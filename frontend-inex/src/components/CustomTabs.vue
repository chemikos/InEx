<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  // Nazwy zakładek, np. ['Finanse', 'Słowniki']
  tabNames: string[];
  // Domyślnie aktywna zakładka (indeks)
  initialActiveTab?: number;
}>();

// Aktywny indeks zakładki
const activeTabIndex = ref(props.initialActiveTab ?? 0);

// Emitowanie zdarzenia, gdy zakładka się zmienia
const emit = defineEmits(['tab-change']);

// Obserwowanie zmian aktywnego indeksu i emitowanie nazwy zakładki
watch(activeTabIndex, (newIndex) => {
  emit('tab-change', props.tabNames[newIndex]);
});
</script>

<template>
  <div class="w-full">
    <div class="flex border-b border-gray-200 mb-4">
      <button
        v-for="(name, index) in tabNames"
        :key="index"
        @click="activeTabIndex = index"
        class="px-4 py-2 text-lg font-medium transition duration-200 ease-in-out"
        :class="{
          'text-indigo-600 border-b-2 border-indigo-600': activeTabIndex === index,
          'text-gray-500 hover:text-gray-700': activeTabIndex !== index,
        }"
      >
        {{ name }}
      </button>
    </div>

    <div class="tab-content">
      <slot :name="`tab-${activeTabIndex}`"></slot>
    </div>
  </div>
</template>
