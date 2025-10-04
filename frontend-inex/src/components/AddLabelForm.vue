<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLabelStore, type NewLabelData } from '@/stores/labelStore';
import { useProfileStore } from '@/stores/profileStore';

const labelStore = useLabelStore();
const profileStore = useProfileStore();

// --- STAN FORMULARZA ---
const newLabelName = ref('');
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const activeProfileId = computed(() => profileStore.activeProfileId);

const handleSubmit = async () => {
  if (!newLabelName.value.trim() || !activeProfileId.value) {
    message.value = { text: 'Musisz wybrać profil i podać nazwę etykiety.', type: 'error' };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  const newLabelData: NewLabelData = {
    labelName: newLabelName.value.trim(),
    profileId: activeProfileId.value,
  };

  try {
    const response = await labelStore.addLabel(newLabelData);

    message.value = {
      text: response.message || `Dodano etykietę ID: ${response.label.id_label}`,
      type: 'success',
    };

    newLabelName.value = ''; // Reset formularza
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
  <div class="p-4 bg-white rounded-lg shadow-md mt-6 border border-dashed border-indigo-300">
    <h3 class="text-xl font-semibold mb-3 text-indigo-700">Dodaj Nową Etykietę</h3>

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodać etykietę.
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="labelName" class="block mb-1 text-sm font-medium text-gray-700"
          >Nazwa Etykiety:</label
        >
        <input
          id="labelName"
          v-model="newLabelName"
          type="text"
          required
          :disabled="isSubmitting"
          placeholder="np. 'Weekend', 'Pilne', 'Raty'"
          class="w-full p-2 border rounded-md"
        />
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId"
        class="w-full p-2 font-bold rounded-md transition duration-150"
        :class="{
          'bg-indigo-600 text-white hover:bg-indigo-700': !isSubmitting && activeProfileId,
          'bg-gray-400 text-gray-700 cursor-not-allowed': isSubmitting || !activeProfileId,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Etykietę (POST /labels)' }}
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
