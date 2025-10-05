<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'vue-router';
import { isAxiosError } from 'axios';

// Użycie propsa 'id' przekazanego z routera
const props = defineProps<{
  id: string; // ID profilu przekazane jako string
}>();

const profileStore = useProfileStore();
const router = useRouter();

// Pobieramy aktywny profil do edycji
const profileToEdit = computed(() => profileStore.activeProfile);

// Stan formularza
const newProfileName = ref(profileToEdit.value ? profileToEdit.value.name : '');
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// Aktualizacja stanu nazwy, gdy Store się załaduje
if (profileToEdit.value) {
  newProfileName.value = profileToEdit.value.name;
}

// Sprawdzenie, czy profil faktycznie istnieje i jest aktywny
if (!profileToEdit.value || profileToEdit.value.id_profile.toString() !== props.id) {
  // Jeśli ID w URL nie zgadza się z aktywnym profilem, przekierowujemy
  router.push({ name: 'dashboard' });
}

// --- LOGIKA AKCJI ---

// W przyszłości, tu będziesz mieć akcję PUT/PATCH
const handleNameUpdate = async () => {
  if (!newProfileName.value.trim() || !profileToEdit.value) {
    message.value = { text: 'Nazwa profilu nie może być pusta.', type: 'error' };
    return;
  }

  // --- MOCK AKCJI AKTUALIZACJI ---
  isSubmitting.value = true;
  message.value = { text: '', type: null };

  try {
    // ZAKŁADAMY, ŻE AKCJA PUT JEST ZDEFINIOWANA W STORE
    // await profileStore.updateProfile(profileToEdit.value.id_profile, newProfileName.value.trim());

    // Na razie tylko symulacja
    const oldName = profileToEdit.value.name;
    profileToEdit.value.name = newProfileName.value.trim(); // Lokalna zmiana w Store

    message.value = {
      text: `Pomyślnie zmieniono nazwę z '${oldName}' na '${newProfileName.value}' (Symulacja POST/PUT)`,
      type: 'success',
    };
  } catch (error) {
    let errorMessage: string = 'Błąd podczas aktualizacji.';
    if (isAxiosError(error)) {
      errorMessage = error.response?.data?.error || `Błąd HTTP ${error.response?.status}.`;
    }
    message.value = { text: errorMessage, type: 'error' };
  } finally {
    isSubmitting.value = false;
  }
};

// W przyszłości, tu będziesz mieć akcję DELETE
const handleDelete = async () => {
  if (
    !confirm(
      `Czy na pewno chcesz usunąć profil: ${profileToEdit.value?.name}? Ta operacja jest nieodwracalna!`,
    )
  ) {
    return;
  }

  // --- MOCK AKCJI USUWANIA ---
  isSubmitting.value = true;

  try {
    // ZAKŁADAMY, ŻE AKCJA DELETE JEST ZDEFINIOWANA W STORE
    // await profileStore.deleteProfile(profileToEdit.value.id_profile);

    // Na razie tylko symulacja
    profileStore.setActiveProfile(null); // Dezaktywujemy
    // Usuwamy z listy (w prawdziwej apce to robi backend/fetchProfiles)
    profileStore.allProfiles = profileStore.allProfiles.filter(
      (p) => p.id_profile.toString() !== props.id,
    );

    message.value = {
      text: `Profil '${profileToEdit.value?.name}' został usunięty (Symulacja DELETE).`,
      type: 'success',
    };

    // Przekierowanie na dashboard po udanym usunięciu
    router.push({ name: 'dashboard' });
  } catch (error) {
    let errorMessage: string = 'Błąd podczas usuwania.';
    if (isAxiosError(error)) {
      errorMessage = error.response?.data?.error || `Błąd HTTP ${error.response?.status}.`;
    }
    message.value = { text: errorMessage, type: 'error' };
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
    <button
      @click="router.push({ name: 'dashboard' })"
      class="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
    >
      &larr; Powrót do Dashboardu
    </button>

    <div v-if="profileToEdit">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">
        Edycja Profilu: {{ profileToEdit.name }}
      </h1>

      <div class="bg-white p-6 rounded-lg shadow-xl mb-8 border-t-4 border-indigo-600">
        <h2 class="text-xl font-semibold mb-4 text-indigo-700">Zmień Nazwę</h2>
        <form @submit.prevent="handleNameUpdate">
          <label for="profile-name" class="block text-sm font-medium text-gray-700"
            >Nowa Nazwa Profilu:</label
          >
          <input
            id="profile-name"
            v-model="newProfileName"
            type="text"
            required
            :disabled="isSubmitting"
            class="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            :disabled="isSubmitting || newProfileName.trim() === profileToEdit.name"
            class="mt-4 w-full p-3 font-bold rounded-md transition duration-150"
            :class="{
              'bg-indigo-600 text-white hover:bg-indigo-700':
                !isSubmitting && newProfileName.trim() !== profileToEdit.name,
              'bg-gray-400 text-gray-700 cursor-not-allowed':
                isSubmitting || newProfileName.trim() === profileToEdit.name,
            }"
          >
            {{ isSubmitting ? 'Zapisywanie...' : 'Zapisz Zmianę Nazwy' }}
          </button>
        </form>
      </div>

      <div class="bg-red-50 p-6 rounded-lg shadow-xl border-t-4 border-red-600">
        <h2 class="text-xl font-semibold mb-4 text-red-700">Strefa Zagrożenia</h2>
        <p class="text-gray-600 mb-4">
          Usunięcie profilu jest operacją nieodwracalną i usunie wszystkie powiązane dane (wpłaty,
          wydatki, pozycje, słowniki).
        </p>
        <button
          @click="handleDelete"
          :disabled="isSubmitting"
          class="w-full p-3 font-bold rounded-md transition duration-150 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Usuwanie...' : `Usuń Profil: ${profileToEdit.name}` }} (DELETE)
        </button>
      </div>

      <div
        v-if="message.text"
        :class="{
          'mt-4 p-3 rounded text-sm font-medium': true,
          'bg-green-100 text-green-700': message.type === 'success',
          'bg-red-100 text-red-700': message.type === 'error',
        }"
      >
        {{ message.text }}
      </div>
    </div>
  </main>
</template>
