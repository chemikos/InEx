<!-- AddProfileForm.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useProfileStore } from '@/stores/profileStore';

const profileStore = useProfileStore();

const newProfileName = ref('');
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const handleSubmit = async () => {
  if (!newProfileName.value.trim()) {
    message.value = { text: 'Nazwa profilu nie może być pusta.', type: 'error' };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  try {
    const response = await profileStore.addProfile(newProfileName.value.trim());

    message.value = {
      text: response.message,
      type: 'success',
    };
    newProfileName.value = '';
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
  <div class="p-4 bg-white rounded-lg shadow-md mt-6 border border-dashed border-gray-300">
    <h3 class="text-xl font-semibold mb-3 text-indigo-700">Dodaj Nowy Profil</h3>

    <form @submit.prevent="handleSubmit">
      <label for="profileName" class="block mb-2 text-sm font-medium text-gray-700"
        >Nazwa Profilu:</label
      >
      <input
        id="profileName"
        v-model="newProfileName"
        type="text"
        required
        :disabled="isSubmitting"
        placeholder="Wprowadź nazwę (np. 'Rodzinny', 'Firmowy')"
        class="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      />

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full mt-3 p-2 font-bold rounded-md transition duration-150"
        :class="{
          'bg-indigo-600 text-white hover:bg-indigo-700': !isSubmitting,
          'bg-gray-400 text-gray-700 cursor-not-allowed': isSubmitting,
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Profil (POST /profiles)' }}
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
