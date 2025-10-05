<script setup lang="ts">
import { ref } from 'vue';
import { useSourceStore } from '@/stores/sourceStore';

const sourceStore = useSourceStore();

// --- STAN EDYCJI ---
// ID źródła, które jest obecnie edytowane (null, jeśli żadne)
const editingSourceId = ref<number | null>(null);
// Tymczasowa nazwa używana w polu input podczas edycji
const tempSourceName = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

/**
 * Rozpoczyna tryb edycji dla danego źródła.
 */
const startEdit = (id: number, currentName: string) => {
  message.value = { text: '', type: null };
  editingSourceId.value = id;
  tempSourceName.value = currentName;
};

/**
 * Anuluje tryb edycji.
 */
const cancelEdit = () => {
  editingSourceId.value = null;
  tempSourceName.value = '';
};

/**
 * Zapisuje zaktualizowaną nazwę źródła (PUT).
 */
const saveEdit = async (sourceId: number, profileId: number) => {
  const newName = tempSourceName.value.trim();

  if (!newName) {
    message.value = { text: 'Nazwa źródła nie może być pusta.', type: 'error' };
    return;
  }

  if (newName === sourceStore.sources.find((s) => s.id_source === sourceId)?.name) {
    cancelEdit(); // Anuluj, jeśli nazwa się nie zmieniła
    return;
  }

  message.value = { text: 'Trwa zapisywanie...', type: null };

  try {
    const result = await sourceStore.updateSource({
      id_source: sourceId,
      newName,
      fk_profile: profileId,
    });

    // Sukces jest obsługiwany przez Pinia Store, który odświeża stan lokalny
    message.value = { text: result.message, type: 'success' };
    cancelEdit(); // Zakończ tryb edycji
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};

/**
 * Obsługuje usuwanie źródła (DELETE).
 */
const confirmDelete = async (sourceId: number, sourceName: string, profileId: number) => {
  if (
    !confirm(
      `Czy na pewno chcesz usunąć źródło: "${sourceName}"? Spowoduje to usunięcie powiązanych transakcji!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await sourceStore.deleteSource(sourceId, profileId);

    // Sukces jest obsługiwany przez Pinia Store, który usuwa element ze stanu
    message.value = { text: result.message, type: 'success' };
  } catch (error) {
    message.value = { text: (error as Error).message, type: 'error' };
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Źródeł Dochodu (Sources)</h2>

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

    <div v-if="sourceStore.isLoading" class="p-4 text-center">Ładowanie źródeł...</div>

    <div v-else-if="sourceStore.sources.length === 0" class="p-4 text-center bg-gray-50 rounded-md">
      Brak zdefiniowanych źródeł dochodu dla tego profilu.
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
          <tr v-for="source in sourceStore.sources" :key="source.id_source" class="table-row">
            <td class="table-cell">
              <template v-if="editingSourceId === source.id_source">
                <input
                  type="text"
                  v-model="tempSourceName"
                  @keyup.enter="saveEdit(source.id_source, source.fk_profile)"
                  class="form-input"
                  style="width: 90%; padding: 0.3rem"
                />
              </template>
              <template v-else>
                {{ source.name }}
              </template>
            </td>

            <td class="table-cell actions-cell">
              <template v-if="editingSourceId === source.id_source">
                <button
                  @click="saveEdit(source.id_source, source.fk_profile)"
                  class="btn-action btn-edit-save mr-2"
                >
                  Zapisz
                </button>
                <button @click="cancelEdit" class="btn-action btn-secondary-small">Anuluj</button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(source.id_source, source.name)"
                  class="btn-action btn-edit mr-2"
                >
                  Edytuj
                </button>
                <button
                  @click="confirmDelete(source.id_source, source.name, source.fk_profile)"
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
