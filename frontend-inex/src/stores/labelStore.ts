import { defineStore, storeToRefs } from 'pinia'; // Importujemy storeToRefs
import { ref, computed } from 'vue';
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
  const profileStore = useProfileStore(); // ZMIANA 1: Używamy storeToRefs do uzyskania reaktywnego, zweryfikowanego ID
  const { verifiedActiveProfileId } = storeToRefs(profileStore); // --- STATE ---

  const labels = ref<Label[]>([]);
  const isLoading = ref(false); // --- GETTERS (Computed) ---

  const labelCount = computed(() => labels.value.length); // ZMIANA 2: Nowy getter, który zwraca listę etykiet tylko, jeśli profil jest zweryfikowany
  const activeLabels = computed(() => {
    if (verifiedActiveProfileId.value === null) {
      return [];
    }
    return labels.value;
  }); // --- ACTIONS ---
  /**
   * Pobiera listę etykiet dla danego profilu (GET).
   */

  async function fetchLabels(profileId: number) {
    // ZMIANA 3: Wymuszamy sprawdzenie ID. Jeśli jest null/0, resetujemy dane i przerywamy.
    if (!profileId) {
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
  } /**
   * Dodaje nową etykietę (POST).
   */

  async function addLabel(labelData: NewLabelData) {
    if (!labelData.labelName) throw new Error('Nazwa etykiety jest wymagana.'); // ZMIANA 4: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || labelData.profileId !== currentActiveId) {
      throw new Error(
        'Nie można dodać etykiety: Brak aktywnego profilu lub niezgodność ID profilu.',
      );
    }

    try {
      const response = await http.post('/labels', labelData);
      const data = response.data; // Dodajemy nową etykietę do lokalnego stanu
      const newLabel: Label = {
        id_label: data.labelId, // Zakładamy, że backend zwraca ID
        name: labelData.labelName,
        fk_profile: labelData.profileId,
      };
      labels.value.push(newLabel);
      return { label: newLabel, message: data.message };
    } catch (error) {
      // Poprawiamy obsługę błędu na użycie nowej funkcji
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Aktualizuje istniejącą etykietę (PUT).
   */

  async function updateLabel(updateData: UpdateLabelData) {
    // ZMIANA 5: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || updateData.fk_profile !== currentActiveId) {
      throw new Error('Nie można zaktualizować etykiety: Niezgodność ID aktywnego profilu.');
    }

    try {
      const url = `/labels/${updateData.id_label}`; // WYSYŁANIE ZGODNE Z TWOJĄ KONWENCJĄ: labelName i profileId w body

      await http.put(url, {
        labelName: updateData.newName,
        profileId: updateData.fk_profile,
      }); // Aktualizacja stanu lokalnego

      const labelToUpdate = labels.value.find((l) => l.id_label === updateData.id_label);
      if (labelToUpdate) {
        labelToUpdate.name = updateData.newName;
      }
      return {
        success: true,
        message: `Etykieta z ID ${updateData.id_label} została zaktualizowana na: ${updateData.newName}.`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } /**
   * Usuwa etykietę (DELETE).
   */

  async function deleteLabel(labelId: number, profileId: number) {
    // ZMIANA 6: Dodatkowe sprawdzenie, czy operacja dotyczy aktualnie aktywnego, zweryfikowanego profilu
    const currentActiveId = verifiedActiveProfileId.value;
    if (!currentActiveId || profileId !== currentActiveId) {
      throw new Error('Nie można usunąć etykiety: Niezgodność ID aktywnego profilu.');
    }

    try {
      // WYSYŁANIE ZGODNE Z TWOJĄ KONWENCJĄ: profileId w query stringu
      const url = `/labels/${labelId}?profileId=${profileId}`;

      await http.delete(url); // Usunięcie ze stanu lokalnego

      labels.value = labels.value.filter((l) => l.id_label !== labelId);

      return { success: true, message: `Etykieta z ID ${labelId} została usunięta.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  } // Zwrócenie stanu i akcji

  return {
    labels,
    activeLabels, // ZWRACAMY NOWY BEZPIECZNY GETTER
    isLoading,
    labelCount,
    fetchLabels,
    addLabel,
    updateLabel,
    deleteLabel,
  };
});
