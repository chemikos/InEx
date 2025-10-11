import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore';

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
  const profileStore = useProfileStore(); // ZMIANA 1: Importujemy verifiedActiveProfileId, który jest strażnikiem
  const { verifiedActiveProfileId } = storeToRefs(profileStore); // --- STATE ---

  const sources = ref<Source[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const sourceCount = computed(() => sources.value.length); // ZMIANA 2: Getter dla listy rozwijanej/wyświetlania, który jest świadomy profilu
  const activeSources = computed(() => {
    // Zwracamy listę tylko, jeśli ID profilu jest zweryfikowane
    if (verifiedActiveProfileId.value === null) {
      return [];
    }
    return sources.value;
  }); // --- ACTIONS ---
  /**
   * Pobiera listę źródeł dochodu dla danego profilu (GET).
   */

  async function fetchSources(profileId: number) {
    // ZMIANA 3: Wymuszamy sprawdzenie ID. Jeśli jest null/0, resetujemy dane i przerywamy.
    if (!profileId) {
      sources.value = [];
      return;
    }
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
  } /**
   * Dodaje nowe źródło dochodu (POST).
   */

  async function addSource(sourceData: NewSourceData) {
    if (!sourceData.sourceName) throw new Error('Nazwa źródła jest wymagana.'); // ZMIANA 4: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || sourceData.profileId !== currentActiveId) {
      throw new Error('Nie można dodać źródła: Brak aktywnego profilu lub niezgodność ID profilu.');
    }

    try {
      const response = await http.post('/sources', sourceData);
      const data = response.data; // Dodajemy do stanu tylko jeśli ID profilu jest zgodne (co już jest zagwarantowane przez currentActiveId)
      const newSource: Source = {
        id_source: data.sourceId, // Zakładamy, że backend zwraca ID
        name: sourceData.sourceName,
        fk_profile: sourceData.profileId,
      };
      sources.value.push(newSource);
      return { source: newSource, message: data.message };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Aktualizuje istniejące źródło dochodu (PUT).
   */

  async function updateSource(updateData: UpdateSourceData) {
    // ZMIANA 5: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || updateData.fk_profile !== currentActiveId) {
      throw new Error('Nie można zaktualizować źródła: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/sources/${updateData.id_source}`; // Wysyłamy zapytanie PUT z nową nazwą

      await http.put(url, { sourceName: updateData.newName, profileId: updateData.fk_profile }); // Aktualizacja stanu lokalnego

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
  } /**
   * Usuwa źródło dochodu (DELETE).
   */

  async function deleteSource(sourceId: number, profileId: number) {
    // ZMIANA 6: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || profileId !== currentActiveId) {
      throw new Error('Nie można usunąć źródła: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/sources/${sourceId}?profileId=${profileId}`; // Wysyłamy zapytanie DELETE

      await http.delete(url); // Usunięcie ze stanu lokalnego

      sources.value = sources.value.filter((s) => s.id_source !== sourceId);

      return { success: true, message: `Źródło z ID ${sourceId} zostało usunięte.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    sources,
    activeSources, // ZWRACAMY NOWY GETTER dla komponentów
    isLoading,
    sourceCount,
    fetchSources,
    addSource,
    updateSource,
    deleteSource,
  };
});
