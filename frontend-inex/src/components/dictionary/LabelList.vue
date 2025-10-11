<script setup lang="ts">
import { ref, watch, computed } from 'vue'; // Dodano computed
import { useLabelStore } from '@/stores/labelStore';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profileStore';

const labelStore = useLabelStore();
const profileStore = useProfileStore();

// ZMIANA 1: Używamy teraz bezpiecznego gettera 'activeLabels' zamiast surowego 'labels'
const { activeLabels, isLoading } = storeToRefs(labelStore);

// Wprowadzamy flagę gotowości i zweryfikowane ID profilu
const { verifiedActiveProfileId, isProfileStoreReady } = storeToRefs(profileStore);

// ZMIANA 2: Tworzymy alias do zweryfikowanego ID
const activeProfileId = computed(() => verifiedActiveProfileId.value);

// --- FUNKCJA POBIERANIA DANYCH ---
const loadData = (id: number | null) => {
  // Wywołujemy funkcję fetch tylko jeśli ID jest dostępne i poprawne.
  if (id !== null) {
    labelStore.fetchLabels(id);
  }
  // NIE czyścimy już listy lokalnie (labels.value = []),
  // ponieważ bezpieczny getter 'activeLabels' (założony w Store) zadba o ukrycie danych.
};

// === GŁÓWNA REAKTYWNOŚĆ: ===
// ZMIANA 3: Reagujemy tylko na zmianę zweryfikowanego ID LUB gotowości Store
watch(
  [activeProfileId, isProfileStoreReady],
  ([newId, isReady]) => {
    // Zapytanie wysyłamy TYLKO jeśli Store jest gotowy ORAZ ID jest aktywne.
    if (isReady && newId !== null) {
      // Wymuszamy przeładowanie danych dla nowego profilu
      loadData(newId);
    } else if (isReady && newId === null) {
      // Store jest gotowy, ale nie ma aktywnego profilu - lista w geterze będzie pusta.
      // Opcjonalnie: możemy wywołać fetch z null, aby Store sam się zresetował,
      // ale przy założeniu, że Store używa verifiedActiveProfileId, wystarczy brak akcji.
      // Dla pewności utrzymujemy ten blok, by logikę ładowania zostawić w Store.
    }
  },
  {
    immediate: true, // Zapewnia wyzwolenie przy montażu
  },
);

// --- STAN EDYCJI ---
const editingLabelId = ref<number | null>(null);
const tempLabelName = ref('');

// --- KOMUNIKATY ZWROTNE ---
const message = ref<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

// ZAMIANA: Użyjemy prostej funkcji do symulacji modala (zgodnie z instrukcją Canvas)
const showConfirmModal = (message: string) => {
  return window.confirm(message);
};

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

  // ZMIANA 4: Używamy bezpiecznego gettera do porównania (lub surowej listy, jeśli Store nie ma activeLabels)
  if (newName === activeLabels.value.find((l) => l.id_label === labelId)?.name) {
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
    !showConfirmModal(
      `Czy na pewno chcesz usunąć etykietę: "${labelName}"? Spowoduje to usunięcie powiązanych transakcji!`,
    )
  ) {
    return;
  }

  message.value = { text: 'Trwa usuwanie...', type: null };

  try {
    const result = await labelStore.deleteLabel(labelId, profileId); // Przekazanie profileId
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
    <div v-if="!isProfileStoreReady || isLoading" class="p-4 text-center">Ładowanie etykiet...</div>
    <div v-else-if="activeProfileId === null" class="p-4 text-center bg-gray-50 rounded-md">
      Nie wybrano aktywnego profilu. Proszę go utworzyć lub wybrać.
    </div>
    <!-- ZMIANA 5: Używamy activeLabels, który jest bezpiecznym getterem -->
    <div v-else-if="activeLabels.length === 0" class="p-4 text-center bg-gray-50 rounded-md">
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
          <!-- ZMIANA 6: Iterujemy po activeLabels -->
          <tr v-for="label in activeLabels" :key="label.id_label" class="table-row">
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
              <template v-else> {{ label.name }} </template>
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
