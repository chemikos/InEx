<script setup lang="ts">
import { useLabelStore } from '@/stores/labelStore';

const labelStore = useLabelStore();

const editLabel = (id: number) => {
  console.log(`Edycja etykiety ID: ${id}`);
  alert(`Edycja etykiety ID: ${id} (W BUDOWIE)`);
};

const deleteLabel = (id: number) => {
  console.log(`Usuwanie etykiety ID: ${id}`);
  if (confirm(`Czy na pewno chcesz usunąć etykietę ID: ${id}?`)) {
    // Logika delete (do zaimplementowania w Pinia Store później)
    alert(`Etykieta ID: ${id} usunięta! (W BUDOWIE)`);
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Etykiet</h2>
    <div v-if="labelStore.isLoading" class="p-4 text-center">Ładowanie etykiet...</div>

    <div v-else-if="labelStore.labels.length === 0" class="p-4 text-center bg-gray-50 rounded-md">
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
          <tr v-for="label in labelStore.labels" :key="label.id_label" class="table-row">
            <td class="table-cell">{{ label.name }}</td>
            <td class="table-cell actions-cell">
              <button @click="editLabel(label.id_label)" class="btn-action btn-edit">Edytuj</button>
              <button @click="deleteLabel(label.id_label)" class="btn-action btn-delete">
                Usuń
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
