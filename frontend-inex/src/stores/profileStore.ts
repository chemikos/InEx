// src/stores/profileStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'
import router from '@/router'

// Definicja typu dla Profilu
export interface Profile {
  id_profile: number
  name: string
}

export const useProfileStore = defineStore('profile', () => {
  // --- STATE ---
  const allProfiles = ref<Profile[]>([])
  const activeProfileId = ref<number | null>(null)

  // --- GETTERS (Computed) ---
  const activeProfile = computed(() => {
    return allProfiles.value.find((p) => p.id_profile === activeProfileId.value) || null
  })

  // --- ACTIONS ---
  async function fetchProfiles() {
    try {
      const response = await http.get('/profiles')
      allProfiles.value = response.data

      // Jeśli nie ma aktywnego ID, domyślnie ustawiamy pierwszy profil
      if (
        allProfiles.value.length > 0 &&
        activeProfileId.value === null &&
        allProfiles.value[0] !== undefined &&
        allProfiles.value[0].id_profile !== undefined
      ) {
        setActiveProfile(allProfiles.value[0].id_profile)
      }
    } catch (error) {
      console.error('Błąd podczas pobierania profili:', error)
      // Przekierowanie na stronę błędu/inicjalizacji, jeśli nie ma profili
      router.push({ name: 'error', params: { code: 'PROFILE_LOAD_FAIL' } })
    }
  }

  function setActiveProfile(id: number) {
    if (activeProfileId.value !== id) {
      activeProfileId.value = id
      // Tu można zaimplementować np. przeładowanie danych dla nowego profilu
      console.log(`Aktywowano profil ID: ${id}`)
    }
  }

  // Używamy tego w komponentach do sprawdzenia, czy profil jest gotowy
  const isProfileLoaded = computed(() => activeProfileId.value !== null)

  return {
    allProfiles,
    activeProfileId,
    activeProfile,
    isProfileLoaded,
    fetchProfiles,
    setActiveProfile,
  }
})
