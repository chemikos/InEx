import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import router from '@/router';
import { isAxiosError } from 'axios';

const ACTIVE_PROFILE_KEY = 'activeProfileId';

export interface Profile {
  id_profile: number;
  name: string;
}

export const useProfileStore = defineStore('profile', () => {
  // --- STATE ---
  const allProfiles = ref<Profile[]>([]);

  const storedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  const initialActiveId = storedId ? parseInt(storedId) : null;
  const activeProfileId = ref<number | null>(initialActiveId);

  // --- GETTERS (Computed) ---
  const activeProfile = computed(() => {
    return allProfiles.value.find((p) => p.id_profile === activeProfileId.value) || null;
  });

  const isProfileLoaded = computed(() => activeProfileId.value !== null);

  function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
      return error.response?.data?.error || `Błąd HTTP ${error.response?.status} podczas operacji.`;
    } else if (error instanceof Error) {
      return error.message;
    }
    return 'Nieznany błąd serwera. Sprawdź konsolę.';
  }

  // --- ACTIONS ---
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
  }

  async function fetchProfiles() {
    try {
      const response = await http.get<Profile[]>('/profiles');
      allProfiles.value = response.data;
      const profilesExist = allProfiles.value.length > 0;
      const currentActiveExists =
        profilesExist && allProfiles.value.some((p) => p.id_profile === activeProfileId.value);
      if (!currentActiveExists && profilesExist) {
        const firstProfile = allProfiles.value[0];
        if (firstProfile) {
          setActiveProfile(firstProfile.id_profile);
        }
      } else if (!profilesExist) {
        setActiveProfile(null);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania profili:', error);
      router.push({ name: 'error', params: { code: 'PROFILE_LOAD_FAIL' } });
    }
  }

  async function addProfile(profileName: string) {
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
    try {
      const url = `/profiles/${profileId}`;
      await http.delete(url);
      allProfiles.value = allProfiles.value.filter((p) => p.id_profile !== profileId);
      if (activeProfileId.value === profileId) {
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
    activeProfile,
    isProfileLoaded,
    fetchProfiles,
    setActiveProfile,
    addProfile,
    updateProfile,
    deleteProfile,
  };
});
