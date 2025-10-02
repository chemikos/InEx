<script setup lang="ts">
import { useProfileStore } from '@/stores/profileStore'
import { onMounted } from 'vue'
// import { watch } from 'vue'

const profileStore = useProfileStore()

// 1. Wywołujemy pobieranie profili przy pierwszym załadowaniu komponentu
onMounted(() => {
  profileStore.fetchProfiles()
})

// 2. Obsługa zmiany wybranego profilu przez użytkownika
const handleProfileChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newId = parseInt(target.value)
  profileStore.setActiveProfile(newId)
}
</script>

<template>
  <div class="p-4 bg-gray-100 rounded-lg shadow-sm mb-6">
    <div v-if="!profileStore.isProfileLoaded" class="text-center text-gray-500">
      Ładowanie profili...
    </div>

    <div v-else>
      <div class="mb-3 font-semibold">
        Aktywny profil:
        <span class="text-blue-600">{{ profileStore.activeProfile?.name || 'Brak' }}</span>
        (ID: {{ profileStore.activeProfileId || '?' }})
      </div>

      <label for="profile-select" class="block mb-1 text-sm text-gray-600"> Zmień profil: </label>
      <select
        id="profile-select"
        :value="profileStore.activeProfileId"
        @change="handleProfileChange"
        class="w-full p-2 border rounded-md"
      >
        <option
          v-for="profile in profileStore.allProfiles"
          :key="profile.id_profile"
          :value="profile.id_profile"
        >
          {{ profile.name }}
        </option>
        <option v-if="profileStore.allProfiles.length === 0" value="" disabled>
          Brak profili do wyboru
        </option>
      </select>
    </div>
  </div>
</template>
