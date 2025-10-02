// src/stores/labelStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';

// Definicja typu dla Etykiety
export interface Label {
  id_label: number;
  name: string;
  fk_profile: number;
}

export const useLabelStore = defineStore('label', () => {
  // --- STATE ---
  const labels = ref<Label[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const labelCount = computed(() => labels.value.length);

  // --- ACTIONS ---
  async function fetchLabels(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /labels?profileId=...
      const response = await http.get(`/labels?profileId=${profileId}`);

      labels.value = response.data as Label[];
    } catch (error) {
      console.error(`Błąd podczas pobierania etykiet dla profilu ${profileId}:`, error);
      labels.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Zwrócenie stanu i akcji
  return {
    labels,
    isLoading,
    labelCount,
    fetchLabels,
  };
});
