// src/stores/sourceStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

// Definicja typu dla Źródła Dochodów
export interface Source {
  id_source: number;
  name: string;
  fk_profile: number;
}
export interface NewSourceData {
  sourceName: string;
  profileId: number;
}

export const useSourceStore = defineStore('source', () => {
  // --- STATE ---
  const sources = ref<Source[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const sourceCount = computed(() => sources.value.length);

  // --- ACTIONS ---
  async function fetchSources(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /sources?profileId=...
      const response = await http.get(`/sources?profileId=${profileId}`);

      sources.value = response.data as Source[];
    } catch (error) {
      console.error(`Błąd podczas pobierania źródeł dochodów dla profilu ${profileId}:`, error);
      sources.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function addSource(sourceData: NewSourceData) {
    if (!sourceData.sourceName) throw new Error('Nazwa źródła jest wymagana.');

    try {
      const response = await http.post('/sources', sourceData);
      const data = response.data;

      const newSourceId = data.sourceId;
      const successMessage = data.message;

      // Tworzymy uproszczony obiekt na podstawie danych wejściowych
      const newSource = {
        id_source: newSourceId,
        name: sourceData.sourceName,
        fk_profile: sourceData.profileId,
      };

      // Dodajemy nowe źródło do lokalnego stanu
      sources.value.push(newSource);

      console.log(`Pomyślnie dodano źródło: ${sourceData.sourceName}`);

      // Zwracamy obiekt z pełnym komunikatem sukcesu
      return { source: newSource, message: successMessage };
    } catch (error) {
      let errorMessage: string = 'Nieznany błąd serwera. Sprawdź konsolę.';

      if (isAxiosError(error)) {
        // Odczytujemy błąd z obiektu response.data
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
    sources,
    isLoading,
    sourceCount,
    fetchSources,
    addSource,
  };
});
