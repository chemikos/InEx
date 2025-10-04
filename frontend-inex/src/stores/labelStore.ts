// src/stores/labelStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

// Definicja typu dla Etykiety
export interface Label {
  id_label: number;
  name: string;
  fk_profile: number;
}
export interface NewLabelData {
  labelName: string;
  profileId: number;
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

  async function addLabel(labelData: NewLabelData) {
    if (!labelData.labelName) throw new Error('Nazwa etykiety jest wymagana.');

    try {
      const response = await http.post('/labels', labelData);
      const data = response.data;

      const newLabelId = data.labelId;
      const successMessage = data.message;

      // Tworzymy obiekt na podstawie danych wejściowych
      const newLabel: Label = {
        id_label: newLabelId,
        name: labelData.labelName,
        fk_profile: labelData.profileId,
      };

      // Dodajemy nową etykietę do lokalnego stanu
      labels.value.push(newLabel);

      console.log(`Pomyślnie dodano etykietę: ${labelData.labelName}`);

      // Zwracamy obiekt z pełnym komunikatem sukcesu
      return { label: newLabel, message: successMessage };
    } catch (error) {
      let errorMessage: string = 'Nieznany błąd serwera. Sprawdź konsolę.';

      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || `Błąd HTTP ${error.response?.status}.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Rzucamy błąd dalej
      throw new Error(errorMessage);
    }
  }

  // Zwrócenie stanu i akcji
  return {
    labels,
    isLoading,
    labelCount,
    fetchLabels,
    addLabel,
  };
});
