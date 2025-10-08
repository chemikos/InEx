import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';
import { useProfileStore } from './profileStore';

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
// NOWY TYP DANYCH dla aktualizacji
export interface UpdateLabelData {
  id_label: number;
  newName: string;
  fk_profile: number; // Wymagane przez backend w body PUT
}

// --- HELPER FUNKCJA DO OBSŁUGI BŁĘDÓW (zgodna z konwencją 'message') ---
function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Używamy pola 'message' zgodnie z Twoją konwencją
    return error.response?.data?.message || `Błąd HTTP ${error.response?.status} podczas operacji.`;
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Nieznany błąd serwera. Sprawdź konsolę.';
}

export const useLabelStore = defineStore('label', () => {
  const profileStore = useProfileStore();
  // --- STATE ---
  const labels = ref<Label[]>([]);
  const isLoading = ref(false);

  // --- GETTERS (Computed) ---
  const labelCount = computed(() => labels.value.length);

  // --- ACTIONS ---

  /**
   * Pobiera listę etykiet dla danego profilu (GET).
   */
  async function fetchLabels(profileId: number) {
    if (!profileId) {
      // Jeśli nie ma ID, resetujemy dane i przerywamy.
      labels.value = [];
      return;
    }
    isLoading.value = true;
    try {
      const response = await http.get<Label[]>(`/labels?profileId=${profileId}`);
      labels.value = response.data;
    } catch (error) {
      console.error(`Błąd podczas pobierania etykiet dla profilu ${profileId}:`, error);
      labels.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // === KLUCZOWA LOGIKA REAKTYWNOŚCI ===
  // Obserwowanie zmiany aktywnego profilu i wywoływanie fetchCategories
  watch(
    () => profileStore.activeProfileId,
    (newId) => {
      // Wywołaj funkcję fetchLabels dla nowego ID (może być null)
      if (newId !== null) {
        fetchLabels(newId);
      } else {
        labels.value = []; // Wyczyść, jeśli nie ma aktywnego profilu
      }
    },
    { immediate: true }, // Uruchom watchera od razu, gdy Store jest inicjowany
  );
  // ===================================

  /**
   * Dodaje nową etykietę (POST).
   */
  async function addLabel(labelData: NewLabelData) {
    if (!labelData.labelName) throw new Error('Nazwa etykiety jest wymagana.');

    try {
      // const newLabel: Label = {
      //   id_label: data.labelId,
      //   name: labelData.labelName,
      //   fk_profile: labelData.profileId,
      // };

      // // Dodajemy nową etykietę do lokalnego stanu
      // labels.value.push(newLabel);

      // return { label: newLabel, message: data.message };

      const response = await http.post('/labels', labelData);
      const data = response.data;
      // Jeżeli dodanie się powiodło i jest aktywny profil
      if (profileStore.activeProfileId === labelData.profileId) {
        const newLabel: Label = {
          id_label: data.labelId, // Zakładamy, że backend zwraca ID
          name: labelData.labelName,
          fk_profile: labelData.profileId,
        };
        // Dodajemy nową kategorię do lokalnego stanu
        labels.value.push(newLabel);
        return { label: newLabel, message: data.message };
      }

      return { label: null, message: data.message };
    } catch (error) {
      // Poprawiamy obsługę błędu na użycie nowej funkcji
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Aktualizuje istniejącą etykietę (PUT).
   */
  async function updateLabel(updateData: UpdateLabelData) {
    try {
      const url = `/labels/${updateData.id_label}`;

      // WYSYŁANIE ZGODNE Z TWOJĄ KONWENCJĄ: labelName i profileId w body
      await http.put(url, {
        labelName: updateData.newName,
        profileId: updateData.fk_profile,
      });

      // Aktualizacja stanu lokalnego
      if (profileStore.activeProfileId === updateData.fk_profile) {
        const labelToUpdate = labels.value.find((l) => l.id_label === updateData.id_label);
        if (labelToUpdate) {
          labelToUpdate.name = updateData.newName;
        }
      }
      return {
        success: true,
        message: `Etykieta z ID ${updateData.id_label} została zaktualizowana na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Usuwa etykietę (DELETE).
   */
  async function deleteLabel(labelId: number, profileId: number) {
    try {
      // WYSYŁANIE ZGODNE Z TWOJĄ KONWENCJĄ: profileId w query stringu
      const url = `/labels/${labelId}?profileId=${profileId}`;

      await http.delete(url);

      // Usunięcie ze stanu lokalnego
      labels.value = labels.value.filter((l) => l.id_label !== labelId);

      return { success: true, message: `Etykieta z ID ${labelId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // Zwrócenie stanu i akcji
  return {
    labels,
    isLoading,
    labelCount,
    fetchLabels,
    addLabel,
    updateLabel, // NOWA METODA
    deleteLabel, // NOWA METODA
  };
});
