<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLabelStore, type NewLabelData } from '@/stores/labelStore';
import { useProfileStore } from '@/stores/profileStore';
import { storeToRefs } from 'pinia'; // Dodanie importu storeToRefs

const labelStore = useLabelStore();
const profileStore = useProfileStore();

// Używamy storeToRefs do reaktywnego pobrania zweryfikowanego ID
const { verifiedActiveProfileId } = storeToRefs(profileStore);

// --- STAN FORMULARZA ---
const newLabelName = ref('');
const isSubmitting = ref(false);
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// activeProfileId jest teraz aliasem dla verifiedActiveProfileId
const activeProfileId = computed(() => verifiedActiveProfileId.value);

const handleSubmit = async () => {
  // Walidacja: Sprawdzamy, czy nazwa jest podana ORAZ czy ID profilu jest zweryfikowane (nie null)
  if (!newLabelName.value.trim() || activeProfileId.value === null) {
    message.value = {
      text: 'Musisz wybrać aktywny i zweryfikowany profil oraz podać nazwę etykiety.',
      type: 'error',
    };
    return;
  }

  isSubmitting.value = true;
  message.value = { text: '', type: null }; // Używamy zweryfikowanego ID (rzutujemy na number, bo już sprawdziliśmy, że nie jest null)

  const newLabelData: NewLabelData = {
    labelName: newLabelName.value.trim(),
    profileId: activeProfileId.value as number,
  };

  try {
    const response = await labelStore.addLabel(newLabelData);

    message.value = {
      text:
        response.message ||
        (response.label ? `Dodano etykietę ID: ${response.label.id_label}` : 'Dodano etykietę.'),
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
  <div class="form-container">
    <h3 class="form-title">Dodaj Nową Etykietę</h3>
    <!-- Warunek wyświetlania oparty na activeProfileId (zweryfikowane ID) -->
    <div v-if="!activeProfileId" class="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
      Wybierz aktywny profil, aby dodawać etykiety.
    </div>
    <form v-else @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label for="labelName" class="form-label">Nazwa Etykiety:</label>
        <input
          id="labelName"
          v-model="newLabelName"
          type="text"
          required
          placeholder="np. 'Weekend', 'Subskrypcja'"
          class="form-input"
        />
      </div>
      <button
        type="submit"
        :disabled="isSubmitting || !activeProfileId || !newLabelName.trim()"
        class="btn-primary"
        :class="{ 'btn-disabled': isSubmitting || !activeProfileId || !newLabelName.trim() }"
      >
        {{ isSubmitting ? 'Dodawanie...' : 'Dodaj Etykietę (POST /labels)' }}
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
