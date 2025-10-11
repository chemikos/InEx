<!-- AddProfileForm.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'vue-router';

const profileStore = useProfileStore();
const router = useRouter();
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
    // === KLUCZOWY DODATEK: PRZEKIEROWANIE PO SUKCESIE ===
    setTimeout(() => {
      // Po udanym dodaniu wracamy na główną stronę
      router.push({ name: 'dashboard' });
    }, 1500);
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
  <div class="form-container">
    <h3 class="form-title">Dodaj Nowy Profil Finansowy</h3>

    <form @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="profileName" class="form-label">Nazwa Profilu:</label>
        <input
          id="profileName"
          v-model="newProfileName"
          type="text"
          required
          placeholder="np. 'Budżet 2024', 'Konto Oszczędnościowe'"
          class="form-input"
        />
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !newProfileName.trim()"
        class="btn-primary"
        :class="{ 'btn-disabled': isSubmitting || !newProfileName.trim() }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Profil (POST /profiles)' }}
      </button>
    </form>

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
</template>
