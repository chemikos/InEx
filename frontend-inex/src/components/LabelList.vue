<script setup lang="ts">
import { ref, watch } from 'vue';
// import { onMounted } from 'vue';
import { useLabelStore } from '@/stores/labelStore';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profileStore';

const labelStore = useLabelStore();
const profileStore = useProfileStore();
const { labels, isLoading } = storeToRefs(labelStore);
const { activeProfileId } = storeToRefs(profileStore);

// --- FUNKCJA POBIERANIA DANYCH ---
const loadData = (id: number | null) => {
  if (id !== null) {
    // Wywołujemy funkcję fetch z aktualnym ID
    labelStore.fetchLabels(id);
  } else {
    // Czyścimy listę, jeśli profil jest nieaktywny
    labels.value = [];
  }
};

// === GŁÓWNA REAKTYWNOŚĆ: ===
// 1. Reagujemy na zmianę ID profilu (gdy użytkownik przełącza profil)
watch(
  activeProfileId,
  (newId) => {
    loadData(newId);
  },
  {
    immediate: true, // Powoduje pierwsze ładowanie po montażu
  },
);

// 2. Opcjonalnie: Zapewnienie, że dane są ładowane przy montowaniu.
// Choć watch z immediate: true powinien to robić, to jest to bezpieczne zabezpieczenie.
// Możesz to pominąć, jeśli watch wystarczy.
/*
onMounted(() => {
    loadData(activeProfileId.value);
});
*/

// --- STAN EDYCJI ---
// ID etykiety, która jest obecnie edytowana
const editingLabelId = ref<number | null>(null);
// Tymczasowa nazwa używana w polu input podczas edycji
const tempLabelName = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

/**
 * Rozpoczyna tryb edycji dla danej etykiety.
 */
const startEdit = (id: number, currentName: string) => {
  message.value = { text: '', type: null };
  editingLabelId.value = id;
  tempLabelName.value = currentName;
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingLabelId.value = null;
  tempLabelName.value = '';
};

/**
 * Zapisuje zaktualizowaną nazwę etykiety (PUT).
 */
const saveEdit = async (labelId: number, profileId: number) => {
  const newName = tempLabelName.value.trim();

  if (!newName) {
    message.value = { text: 'Nazwa etykiety nie może być pusta.', type: 'error' };
    return;
  }

  if (newName === labelStore.labels.find((l) => l.id_label === labelId)?.name) {
    cancelEdit();
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const result = await labelStore.updateLabel({
      id_label: labelId,
      newName,
      fk_profile: profileId, // Przekazanie profileId
    });

    // Sukces jest obsługiwany przez Pinia Store
    message.value = { text: result.message, type: 'success' };
    cancelEdit();
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie etykiety (DELETE).
 */
const confirmDelete = async (labelId: number, labelName: string, profileId: number) => {
  if (
    !confirm(
      `Czy na pewno chcesz usunąć etykietę: "${labelName}"? Spowoduje to usunięcie powiązanych transakcji!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await labelStore.deleteLabel(labelId, profileId); // Przekazanie profileId

    // Sukces jest obsługiwany przez Pinia Store
    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Etykiet</h2>

    <div
      v-if="message.text"
      :class="{
        'bg-green-100 border-green-400 text-green-700': message.type === 'success',
        'bg-red-100 border-red-400 text-red-700': message.type === 'error',
      }"
      class="p-3 border rounded-md mb-4 text-sm"
    >
      {{ message.text }}
    </div>

    <div v-if="isLoading" class="p-4 text-center">Ładowanie etykiet...</div>

    <div v-else-if="labels.length === 0" class="p-4 text-center bg-gray-50 rounded-md">
      Brak zdefiniowanych etykiet dla tego profilu.
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">Nazwa</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="label in labels" :key="label.id_label" class="table-row">
            <td class="table-cell">
              <template v-if="editingLabelId === label.id_label">
                <input
                  type="text"
                  v-model="tempLabelName"
                  @keyup.enter="saveEdit(label.id_label, label.fk_profile)"
                  class="form-input"
                  style="width: 90%; padding: 0.3rem"
                />
              </template>
              <template v-else>
                {{ label.name }}
              </template>
            </td>

            <td class="table-cell actions-cell">
              <template v-if="editingLabelId === label.id_label">
                <button
                  @click="saveEdit(label.id_label, label.fk_profile)"
                  class="btn-action btn-edit-save mr-2"
                >
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(label.id_label, label.name)"
                  class="btn-action btn-edit mr-2"
                >
                  Edytuj
                </button>
                <button
                  @click="confirmDelete(label.id_label, label.name, label.fk_profile)"
                  class="btn-action btn-delete"
                >
                  Usuń
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
