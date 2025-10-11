<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'vue-router';

const profileStore = useProfileStore();
const router = useRouter();

onMounted(() => {
  profileStore.fetchProfiles();
});

const selectedProfileId = computed({
  get: () => profileStore.activeProfileId,
  set: (newId) => {
    if (newId !== null) {
      profileStore.setActiveProfile(newId);
    }
  },
});

// Funkcja do przejścia do edycji aktywnego profilu
const goToProfileEdit = () => {
  // Ten warunek musi być spełniony: activeProfileId nie może być null
  if (profileStore.activeProfileId !== null) {
    console.log('Przekierowanie do edycji profilu, ID:', profileStore.activeProfileId);
    router
      .push({
        name: 'profile-edit',
        params: { id: profileStore.activeProfileId.toString() },
      })
      .catch((err) => {
        // Dodajemy logowanie, aby wykryć, czy router wyrzuca błąd (np. 404)
        console.error('Błąd routingu:', err.message);
      });
  } else {
    console.log('Przekierowanie zablokowane: Brak aktywnego profilu.');
  }
};

const goToAddProfile = () => {
  router.push({ name: 'add-profile' });
};
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="logo" @click="router.push({ name: 'dashboard' })">Mój Budżet 💰</h1>

      <div class="profile-controls">
        <div class="profile-select-group">
          <label for="profile-select" class="form-label profile-label-hidden"
            >Aktywny Profil:</label
          >
          <select
            id="profile-select"
            v-model="selectedProfileId"
            class="form-select profile-header-select"
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
          class="btn-edit-profile-header"
          :class="{ 'btn-disabled-header': !profileStore.activeProfileId }"
        >
          Edytuj Profil
        </button>
        <button @click="goToAddProfile" class="btn-add-profile-header mr-2">➕ Dodaj Profil</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: white;
  /* Delikatny cień i stała pozycja, jak w oryginalnym kodzie */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  /* Utrzymanie responsywności i wyśrodkowanie */
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5; /* indigo-600 */
  cursor: pointer;
  margin: 0;
}

.profile-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-select-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Dostosowanie globalnego form-label dla małych ekranów */
.form-label.profile-label-hidden {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  display: none; /* Ukryte na małych ekranach */
}

@media (min-width: 640px) {
  .form-label.profile-label-hidden {
    display: block; /* Pokazane na sm: */
  }
}

/* Nadpisanie globalnego form-select, aby był mniejszy (text-sm i mniejszy padding) */
.form-select.profile-header-select {
  padding: 0.5rem;
  font-size: 0.875rem;
}

/* --- Przycisk Edycji (Wtórny) --- */
.btn-edit-profile-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease-in-out;
  background-color: white;
  border: 1px solid #6366f1; /* indigo-500 */
  color: #4f46e5; /* indigo-600 */
  cursor: pointer;
}

.btn-edit-profile-header:hover:not(:disabled) {
  background-color: #eef2ff; /* indigo-50 */
}

.btn-disabled-header {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #9ca3af; /* gray-400 */
  color: #6b7280; /* gray-500 */
}

/* === NOWY STYL DLA PRZYCISKU DODAJ PROFIL === */
.btn-add-profile-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease-in-out;
  background-color: #10b981; /* green-500 */
  color: white;
  border: 1px solid #059669; /* green-600 */
  cursor: pointer;
}

.btn-add-profile-header:hover {
  background-color: #059669; /* green-600 */
}
</style>
