<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSourceStore, type NewSourceData } from '@/stores/sourceStore';
import { useProfileStore } from '@/stores/profileStore';

const sourceStore = useSourceStore();
const profileStore = useProfileStore();

// --- STAN FORMULARZA ---
const newSourceName = ref('');
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const activeProfileId = computed(() => profileStore.activeProfileId);

const handleSubmit = async () => {
  if (!newSourceName.value.trim() || !activeProfileId.value) {
    message.value = { text: 'Musisz wybrać profil i podać nazwę źródła.', type: 'error' };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  const newSourceData: NewSourceData = {
    sourceName: newSourceName.value.trim(),
    profileId: activeProfileId.value,
  };

  try {
    const response = await sourceStore.addSource(newSourceData);

    message.value = {
      text: response.message || `Dodano źródło ID: ${response.source.id_source}`,
      type: 'success',
    };

    newSourceName.value = ''; // Reset formularza
  } catch (err: unknown) {
    message.value = {
      text: err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas dodawania.',
      type: 'error',
    };
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md mt-6 border border-dashed border-green-300">
    <h3 class="text-xl font-semibold mb-3 text-green-700">Dodaj Nowe Źródło Dochodu</h3>

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodać źródło.
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="sourceName" class="block mb-1 text-sm font-medium text-gray-700"
          >Nazwa Źródła:</label
        >
        <input
          id="sourceName"
          v-model="newSourceName"
          type="text"
          required
          :disabled="isSubmitting"
          placeholder="np. 'Pensja', 'Wynajem', 'Sprzedaż'"
          class="w-full p-2 border rounded-md"
        />
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId"
        class="w-full p-2 font-bold rounded-md transition duration-150"
        :class="{
          'bg-green-600 text-white hover:bg-green-700': !isSubmitting && activeProfileId,
          'bg-gray-400 text-gray-700 cursor-not-allowed': isSubmitting || !activeProfileId,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Źródło (POST /sources)' }}
      </button>
    </form>

    <div
      v-if="message.text"
      :class="{
        'mt-3 p-2 rounded text-sm font-medium': true,
        'bg-green-100 text-green-700': message.type === 'success',
        'bg-red-100 text-red-700': message.type === 'error',
      }"
    >
      {{ message.text }}
    </div>
  </div>
</template>
