import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import { isAxiosError } from 'axios';

const ACTIVE_PROFILE_KEY = 'activeProfileId';

export interface Profile {
  id_profile: number;
  name: string;
}

export const useProfileStore = defineStore('profile', () => {
  // --- STATE ---
  const allProfiles = ref<Profile[]>([]); // Flaga informująca, czy asynchroniczne ładowanie i weryfikacja profili się zakończyły.
  // Wartość false jest używana w komponentach jako GUARD/STRAŻNIK.

  const isProfilesFetched = ref(false); // ZMIANA 1: Usuwamy odczyt z localStorage przy inicjalizacji.
  // activeProfileId jest teraz JAWNIE null, dopóki fetchProfiles go nie ustawi.

  const activeProfileId = ref<number | null>(null); // --- GETTERS (Computed) ---

  const activeProfile = computed(() => {
    // Sprawdzamy, czy store jest gotowy, aby uniknąć tymczasowych błędów
    if (!isProfilesFetched.value) return null;
    return allProfiles.value.find((p) => p.id_profile === activeProfileId.value) || null;
  });

  const isProfileLoaded = computed(() => activeProfileId.value !== null); // Getter używany w komponentach: Store jest gotowy, gdy dane zostały pobrane ORAZ profil jest aktywny (lub w ogóle go nie ma).

  const isProfileStoreReady = computed(
    () =>
      isProfilesFetched.value && (activeProfileId.value !== null || allProfiles.value.length === 0),
  );

  // NOWY GETTER, który ma być używany w innych Store'ach (np. CategoryStore, LabelStore)
  // Gwarantuje, że zwróci ID TYLKO jeśli store jest gotowy.
  const verifiedActiveProfileId = computed<number | null>(() => {
    return isProfileStoreReady.value ? activeProfileId.value : null;
  });

  function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
      return (
        error.response?.data?.message || `Błąd HTTP ${error.response?.status} podczas operacji.`
      );
    } else if (error instanceof Error) {
      return error.message;
    }
    return 'Nieznany błąd serwera. Sprawdź konsolę.';
  } // --- ACTIONS ---

  function setActiveProfile(id: number | null) {
    if (activeProfileId.value !== id) {
      activeProfileId.value = id;
      if (id !== null) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, String(id));
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
      }
      console.log(`Aktywowano profil ID: ${id}`);
    }
  } /**
   * Pobiera listę profili i ustala, który z nich jest aktywny.
   * Ta funkcja jest kluczowa dla inicjalizacji aktywnego profilu.
   */

  async function fetchProfiles() {
    try {
      const response = await http.get<Profile[]>('/profiles');
      const receivedData = Array.isArray(response.data) ? response.data : [];
      allProfiles.value = receivedData; // Weryfikacja: Wczytujemy ID z localStorage TUTAJ, po udanym pobraniu listy.
      const storedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      const idFromStorage = storedId ? parseInt(storedId) : null;

      const profilesExist = allProfiles.value.length > 0; // Sprawdzenie, czy aktywne ID (z localStorage lub domyślne) w ogóle istnieje na liście

      const currentActiveExists =
        profilesExist && allProfiles.value.some((p) => p.id_profile === idFromStorage);

      if (currentActiveExists) {
        // 1. Ustawiamy ID z localStorage, jeśli jest poprawne
        setActiveProfile(idFromStorage);
      } else if (profilesExist) {
        // 2. Jeśli localStorage jest puste/niepoprawne, ustawiamy pierwszy profil jako aktywny (ID=2)
        const firstProfile = allProfiles.value[0];
        if (firstProfile) {
          setActiveProfile(firstProfile.id_profile);
        }
      } else {
        // 3. Profili w ogóle nie ma, czyścimy aktywne ID
        setActiveProfile(null);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania profili:', error);
      allProfiles.value = [];
      setActiveProfile(null);
    } finally {
      // ZAWSZE ustawiamy na true po zakończeniu próby załadowania profili.
      // To wyzwoli WATCH w komponentach.
      isProfilesFetched.value = true;
    }
  }

  async function addProfile(profileName: string) {
    // ... (pozostała logika dodawania bez zmian) ...
    try {
      const response = await http.post('/profiles', {
        profileName: profileName,
      });

      const data = response.data;
      const newProfile: Profile = data.profile
        ? data.profile
        : {
            id_profile: data.profileId || -1,
            name: profileName,
          };

      allProfiles.value.push(newProfile);
      setActiveProfile(newProfile.id_profile);

      return {
        success: true,
        message: data.message || `Pomyślnie dodano profil: ${newProfile.name}`,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function updateProfile(profileId: number, newName: string) {
    // ... (pozostała logika aktualizacji bez zmian) ...
    try {
      const url = `/profiles/${profileId}`;
      await http.put(url, { profileName: newName });
      const profileToUpdate = allProfiles.value.find((p) => p.id_profile === profileId);
      if (profileToUpdate) {
        profileToUpdate.name = newName;
      }
      return { success: true, message: `Nazwa profilu została zaktualizowana na: ${newName}` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function deleteProfile(profileId: number) {
    // ... (pozostała logika usuwania bez zmian) ...
    try {
      const url = `/profiles/${profileId}`;
      await http.delete(url);
      allProfiles.value = allProfiles.value.filter((p) => p.id_profile !== profileId);
      if (activeProfileId.value === profileId) {
        // Jeśli usuwamy aktywny profil, ustawiamy następny jako aktywny
        const newActiveProfileId = allProfiles.value[0]?.id_profile ?? null;
        setActiveProfile(newActiveProfileId);
      }
      return { success: true, message: `Profil z ID ${profileId} został usunięty.` };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  return {
    allProfiles,
    activeProfileId,
    verifiedActiveProfileId, // NOWY ZAAWANSOWANY GETTER
    activeProfile,
    isProfileLoaded,
    isProfileStoreReady,
    isProfilesFetched,
    fetchProfiles,
    setActiveProfile,
    addProfile,
    updateProfile,
    deleteProfile,
  };
});
