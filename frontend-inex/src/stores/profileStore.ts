// src/stores/profileStore.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import http from '@/api/http';
import router from '@/router';
import { isAxiosError } from 'axios';

// Definicja typu dla Profilu
export interface Profile {
  id_profile: number;
  name: string;
}

export const useProfileStore = defineStore('profile', () => {
  // --- STATE ---
  const allProfiles = ref<Profile[]>([]);
  const activeProfileId = ref<number | null>(null);

  // --- GETTERS (Computed) ---
  const activeProfile = computed(() => {
    return allProfiles.value.find((p) => p.id_profile === activeProfileId.value) || null;
  });

  // --- ACTIONS ---
  async function fetchProfiles() {
    try {
      const response = await http.get('/profiles');
      allProfiles.value = response.data;

      if (
        allProfiles.value.length > 0 &&
        activeProfileId.value === null &&
        allProfiles.value[0] !== undefined &&
        allProfiles.value[0].id_profile !== undefined
      ) {
        setActiveProfile(allProfiles.value[0].id_profile);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania profili:', error);
      router.push({ name: 'error', params: { code: 'PROFILE_LOAD_FAIL' } });
    }
  }

  function setActiveProfile(id: number | null) {
    if (activeProfileId.value !== id) {
      activeProfileId.value = id;
      // Tu można zaimplementować np. przeładowanie danych dla nowego profilu
      console.log(`Aktywowano profil ID: ${id}`);
    }
  }

  async function addProfile(profileName: string) {
    // if (!profileName) throw new Error('Nazwa profilu nie może być pusta.');
    try {
      const response = await http.post('/profiles', {
        profileName: profileName,
      });
      const data = response.data;
      const newProfileId = data.profileId;
      const successMessage = data.message;
      const newProfile = {
        id_profile: newProfileId,
        name: profileName,
      };
      allProfiles.value.push(newProfile);
      setActiveProfile(newProfileId);
      console.log(`Pomyślnie dodano profil: ${newProfile.name}`);
      return { profile: newProfile, message: successMessage };
    } catch (error) {
      let errorMessage: string = 'Nieznany błąd serwera. Sprawdź konsolę.';
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.error || `Błąd HTTP ${error.response?.status}.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  const isProfileLoaded = computed(() => activeProfileId.value !== null);

  return {
    allProfiles,
    activeProfileId,
    activeProfile,
    isProfileLoaded,
    fetchProfiles,
    setActiveProfile,
    addProfile,
  };
});
