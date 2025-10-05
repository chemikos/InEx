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
  <main class="profile-edit-main-container">
    <button @click="router.push({ name: 'dashboard' })" class="back-link">
      &larr; Powrót do Dashboardu
    </button>

    <div v-if="profileToEdit">
      <h1 class="page-title">Edycja Profilu: {{ profileToEdit.name }}</h1>

      <div class="form-container edit-section primary-section">
        <h2 class="section-title">Zmień Nazwę</h2>
        <form @submit.prevent="handleNameUpdate">
          <label for="profile-name" class="form-label">Nowa Nazwa Profilu:</label>
          <input
            id="profile-name"
            v-model="newProfileName"
            type="text"
            required
            :disabled="isSubmitting"
            class="form-input"
          />
          <button
            type="submit"
            :disabled="isSubmitting || newProfileName.trim() === profileToEdit.name"
            class="btn-save-profile"
            :class="{
              'btn-disabled': isSubmitting || newProfileName.trim() === profileToEdit.name,
            }"
          >
            {{ isSubmitting ? 'Zapisywanie...' : 'Zapisz Zmianę Nazwy (PUT)' }}
          </button>
        </form>
      </div>

      <div class="form-container edit-section danger-section">
        <h2 class="danger-title">Strefa Zagrożenia</h2>
        <p class="danger-text">
          Usunięcie profilu jest operacją nieodwracalną i usunie wszystkie powiązane dane (wpłaty,
          wydatki, pozycje, słowniki).
        </p>
        <button
          @click="handleDelete"
          :disabled="isSubmitting"
          class="btn-primary"
          :class="{ 'btn-disabled': isSubmitting }"
        >
          {{ isSubmitting ? 'Usuwanie...' : `Usuń Profil: ${profileToEdit.name}` }} (DELETE)
        </button>
      </div>

      <div
        v-if="message.text"
        class="msg-box"
        :class="{
          'msg-success': message.type === 'success',
          'msg-error': message.type === 'error',
        }"
      >
        {{ message.text }}
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Kontener główny, aby zachować max-width */
.profile-edit-main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

/* Link Powrotny */
.back-link {
  color: #4f46e5; /* indigo-600 */
  margin-bottom: 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.15s ease-in-out;
  background: none;
  border: none;
  padding: 0;
}

.back-link:hover {
  color: #3730a3; /* indigo-800 */
}

/* Tytuł Strony */
.page-title {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 800;
  color: #1f2937; /* gray-900 */
  margin-bottom: 1.5rem;
}

/* --- SEKCJE EDYCJI (Bazują na form-container) --- */

.edit-section {
  /* Nadpisanie marginesu i dodanie unikalnego obramowania dla sekcji */
  margin-bottom: 2rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.primary-section {
  border-top: 4px solid #4f46e5; /* border-t-4 border-indigo-600 */
}

.danger-section {
  border-top: 4px solid #dc2626; /* border-t-4 border-red-600 */
  background-color: #fef2f2; /* red-50 */
}

.section-title {
  font-size: 1.25rem; /* text-xl */
  font-weight: 600;
  margin-bottom: 1rem;
  color: #4338ca; /* indigo-700 */
}

.danger-title {
  color: #b91c1c; /* red-700 */
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.danger-text {
  color: #4b5563; /* gray-600 */
  margin-bottom: 1rem;
}

/* --- PRZYCISK ZAPISZ (PUT) --- */
.btn-save-profile {
  /* Używamy stylów btn-primary, ale nadpisujemy kolory na indigo */
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  font-weight: 700;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease-in-out;
  background-color: #4f46e5; /* indigo-600 */
  color: white;
  cursor: pointer;
  border: none;
}

.btn-save-profile:hover:not(:disabled) {
  background-color: #4338ca; /* indigo-700 */
}

/* Globalna klasa btn-disabled obsłuży stan nieaktywny */
</style>
