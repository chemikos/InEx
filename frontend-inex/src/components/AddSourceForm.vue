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
  <div class="form-container">
    <h3 class="form-title">Dodaj Nowe Źródło Dochodu (Source)</h3>

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodawać źródła.
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="sourceName" class="form-label">Nazwa Źródła:</label>
        <input
          id="sourceName"
          v-model="newSourceName"
          type="text"
          required
          placeholder="np. 'Główna wypłata', 'Dochód z najmu'"
          class="form-input"
        />
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId || !newSourceName.trim()"
        class="btn-primary"
        :class="{
          'btn-disabled': isSubmitting || !activeProfileId || !newSourceName.trim(),
        }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Źródło (POST /sources)' }}
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
