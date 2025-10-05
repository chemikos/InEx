<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCategoryStore, type NewCategoryData } from '@/stores/categoryStore';
import { useProfileStore } from '@/stores/profileStore';

const categoryStore = useCategoryStore();
const profileStore = useProfileStore();

// --- STAN FORMULARZA ---
const newCategoryName = ref('');
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

const activeProfileId = computed(() => profileStore.activeProfileId);

const handleSubmit = async () => {
  if (!newCategoryName.value.trim() || !activeProfileId.value) {
    message.value = { text: 'Musisz wybrać profil i podać nazwę kategorii.', type: 'error' };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null };

  const newCategoryData: NewCategoryData = {
    categoryName: newCategoryName.value.trim(),
    profileId: activeProfileId.value,
  };

  try {
    const response = await categoryStore.addCategory(newCategoryData);

    message.value = {
      text: response.message || `Dodano kategorię ID: ${response.category.id_category}`,
      type: 'success',
    };

    newCategoryName.value = ''; // Reset formularza
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
    <h3 class="form-title">Dodaj Nową Kategorię</h3>

    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodawać kategorie.
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="categoryName" class="form-label">Nazwa Kategorii:</label>
        <input
          id="categoryName"
          v-model="newCategoryName"
          type="text"
          required
          placeholder="np. 'Jedzenie', 'Transport'"
          class="form-input"
        />
      </div>

      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId || !newCategoryName.trim()"
        class="btn-primary"
        :class="{ 'btn-disabled': isSubmitting || !activeProfileId || !newCategoryName.trim() }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Kategorię (POST /categories)' }}
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
