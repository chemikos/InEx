// src/stores/sourceStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'

// Definicja typu dla Źródła Dochodów
export interface Source {
  id_source: number
  name: string
  fk_profile: number
}

export const useSourceStore = defineStore('source', () => {
  // --- STATE ---
  const sources = ref<Source[]>([])
  const isLoading = ref(false)

  // --- GETTERS (Computed) ---
  const sourceCount = computed(() => sources.value.length)

  // --- ACTIONS ---
  async function fetchSources(profileId: number) {
    isLoading.value = true
    try {
      // Wywołanie endpointu GET /sources?profileId=...
      const response = await http.get(`/sources?profileId=${profileId}`)

      sources.value = response.data as Source[]
    } catch (error) {
      console.error(`Błąd podczas pobierania źródeł dochodów dla profilu ${profileId}:`, error)
      sources.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Zwrócenie stanu i akcji
  return {
    sources,
    isLoading,
    sourceCount,
    fetchSources,
  }
})
