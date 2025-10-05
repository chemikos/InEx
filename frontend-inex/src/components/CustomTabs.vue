<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  tabNames: string[];
  initialActiveTab?: number;
}>();

const activeTabIndex = ref(props.initialActiveTab ?? 0);
const emit = defineEmits(['tab-change']);

watch(activeTabIndex, (newIndex) => {
  emit('tab-change', props.tabNames[newIndex]);
});
</script>

<template>
  <div class="tabs-container">
    <div class="tabs-nav">
      <button
        v-for="(name, index) in tabNames"
        :key="index"
        @click="activeTabIndex = index"
        class="tab-button"
        :class="{
          'tab-active': activeTabIndex === index,
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

<style scoped>
.tabs-container {
  width: 100%;
}

.tabs-nav {
  display: flex;
  border-bottom: 1px solid #d1d5db; /* Szare obramowanie pod spodem */
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  font-size: 1.125rem; /* 18px */
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280; /* Domyślny kolor tekstu (szary) */
  margin: 0;
  white-space: nowrap;
}

.tab-button:hover:not(.tab-active) {
  color: #4b5563; /* Ciemniejszy szary na hover */
}

.tab-active {
  color: #4f46e5; /* Aktywny kolor (Indygo) */
  border-bottom: 2px solid #4f46e5;
  font-weight: 600;
}

.tab-content {
  padding: 0;
}
</style>
