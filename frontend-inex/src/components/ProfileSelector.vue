<script setup lang="ts">
import { useProfileStore } from '@/stores/profileStore';
import { onMounted } from 'vue';
// import { watch } from 'vue'

const profileStore = useProfileStore();

// 1. Wywołujemy pobieranie profili przy pierwszym załadowaniu komponentu
onMounted(() => {
  profileStore.fetchProfiles();
});

// 2. Obsługa zmiany wybranego profilu przez użytkownika
const handleProfileChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newId = parseInt(target.value);
  profileStore.setActiveProfile(newId);
};
</script>

<template>
  <div class="form-container profile-selector-container">
    <div v-if="!profileStore.isProfileLoaded" class="text-center text-gray-500">
      Ładowanie profili...
    </div>

    <div v-else>
      <div class="mb-3 font-semibold">
        Aktywny profil:
        <span class="text-blue-600">{{ profileStore.activeProfile?.name || 'Brak' }}</span>
        (ID: {{ profileStore.activeProfileId || '?' }})
      </div>

      <label for="profile-select" class="form-label mb-1 text-gray-600"> Zmień profil: </label>
      <select
        id="profile-select"
        :value="profileStore.activeProfileId"
        @change="handleProfileChange"
        class="form-select"
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

<style scoped>
/* Lokalny styl do nadpisania tła i cienia, aby ProfileSelector wizualnie się wyróżniał, 
   zgodnie z oryginalnym stylem. */
.profile-selector-container {
  background-color: #f3f4f6; /* bg-gray-100 */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* mniejszy cień shadow-sm */
  padding: 1rem; /* p-4 */
  border-radius: 0.5rem; /* rounded-lg */
  margin-bottom: 1.5rem; /* mb-6 */
  /* Nadpisujemy domyślny biały kolor i większy cień z form-container */
}

/* Ponieważ form-label ma domyślny kolor gray-700, 
   a w oryginalnym kodzie było gray-600, możemy to zostawić lub usunąć: */
.form-label {
  color: #4b5563; /* gray-600 */
}
</style>
