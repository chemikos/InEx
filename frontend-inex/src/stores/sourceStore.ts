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
export interface UpdateSourceData {
  id_source: number;
  newName: string;
  fk_profile: number;
}

// --- HELPER FUNKCJA DO OBSŁUGI BŁĘDÓW ---
function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Zakładamy, że backend zwraca pole 'error' w treści odpowiedzi dla błędów
    return error.response?.data?.message || `Błąd HTTP ${error.response?.status} podczas operacji.`;
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Nieznany błąd serwera. Sprawdź konsolę.';
}

export const useSourceStore = defineStore('source', () => {
  // --- STATE ---
  const sources = ref<Source[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const sourceCount = computed(() => sources.value.length);

  // --- ACTIONS ---

  /**
   * Pobiera listę źródeł dochodu dla danego profilu (GET).
   */
  async function fetchSources(profileId: number) {
    isLoading.value = true;
    try {
      // Wywołanie endpointu GET /sources?profileId=...
      const response = await http.get<Source[]>(`/sources?profileId=${profileId}`);
      sources.value = response.data;
    } catch (error) {
      console.error(`Błąd podczas pobierania źródeł dochodów dla profilu ${profileId}:`, error);
      sources.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Dodaje nowe źródło dochodu (POST).
   */
  async function addSource(sourceData: NewSourceData) {
    if (!sourceData.sourceName) throw new Error('Nazwa źródła jest wymagana.');

    try {
      const response = await http.post('/sources', sourceData);
      const data = response.data;

      const newSource: Source = {
        id_source: data.sourceId,
        name: sourceData.sourceName,
        fk_profile: sourceData.profileId,
      };

      // Dodajemy nowe źródło do lokalnego stanu
      sources.value.push(newSource);

      return { source: newSource, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Aktualizuje istniejące źródło dochodu (PUT).
   */
  async function updateSource(updateData: UpdateSourceData) {
    try {
      const url = `/sources/${updateData.id_source}`;

      // Wysyłamy zapytanie PUT z nową nazwą
      // Uwaga: Zakładamy, że backend oczekuje klucza 'name' dla spójności
      await http.put(url, { sourceName: updateData.newName, profileId: updateData.fk_profile });

      // Aktualizacja stanu lokalnego
      const sourceToUpdate = sources.value.find((s) => s.id_source === updateData.id_source);
      if (sourceToUpdate) {
        sourceToUpdate.name = updateData.newName;
      }

      return {
        success: true,
        message: `Źródło z ID ${updateData.id_source} zostało zaktualizowane na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Usuwa źródło dochodu (DELETE).
   */
  async function deleteSource(sourceId: number, profileId: number) {
    try {
      const url = `/sources/${sourceId}?profileId=${profileId}`;

      // Wysyłamy zapytanie DELETE
      await http.delete(url);

      // Usunięcie ze stanu lokalnego
      sources.value = sources.value.filter((s) => s.id_source !== sourceId);

      return { success: true, message: `Źródło z ID ${sourceId} zostało usunięte.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // Zwrócenie stanu i akcji
  return {
    sources,
    isLoading,
    sourceCount,
    fetchSources,
    addSource,
    updateSource,
    deleteSource,
  };
});
