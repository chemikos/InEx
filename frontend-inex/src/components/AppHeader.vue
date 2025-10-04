<script setup lang="ts">
import { computed } from 'vue';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'vue-router';

const profileStore = useProfileStore();
const router = useRouter();

// Używamy aktywnego ID profilu, aby podświetlić go w selekcie
const selectedProfileId = computed({
  get: () => profileStore.activeProfileId,
  set: (newId) => {
    if (newId !== null) {
      profileStore.setActiveProfile(newId);
      // Opcjonalnie: Przekierowanie na Dashboard po zmianie profilu
      if (router.currentRoute.value.name !== 'dashboard') {
        router.push({ name: 'dashboard' });
      }
    }
  },
});

// Funkcja do przejścia do edycji aktywnego profilu (utworzymy tę trasę później)
const goToProfileEdit = () => {
  if (profileStore.activeProfileId !== null) {
    // Przekierowanie na nową podstronę edycji
    router.push({
      name: 'profile-edit',
      params: { id: profileStore.activeProfileId.toString() },
    });
  }
};
</script>

<template>
  <header class="bg-white shadow-lg p-4 sticky top-0 z-10 border-b border-gray-200">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <h1
        class="text-2xl font-bold text-indigo-700 cursor-pointer"
        @click="router.push({ name: 'dashboard' })"
      >
        Mój Budżet 💰
      </h1>

      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <label for="profile-select" class="text-sm font-medium text-gray-700 hidden sm:block"
            >Aktywny Profil:</label
          >
          <select
            id="profile-select"
            v-model="selectedProfileId"
            class="p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
            :disabled="profileStore.allProfiles.length === 0"
          >
            <option :value="null" disabled>Wybierz...</option>
            <option
              v-for="profile in profileStore.allProfiles"
              :key="profile.id_profile"
              :value="profile.id_profile"
            >
              {{ profile.name }}
            </option>
          </select>
        </div>

        <button
          @click="goToProfileEdit"
          :disabled="!profileStore.activeProfileId"
          class="p-2 border border-indigo-500 text-indigo-600 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
        >
          Edytuj Profil
        </button>
      </div>
    </div>
  </header>
</template>
